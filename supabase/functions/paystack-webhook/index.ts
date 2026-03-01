import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response("Not configured", { status: 500, headers: corsHeaders });
    }

    const body = await req.text();
    
    // Verify Paystack signature
    const signature = req.headers.get("x-paystack-signature");
    if (signature) {
      const encoder = new TextEncoder();
      const key = encoder.encode(PAYSTACK_SECRET_KEY);
      const data = encoder.encode(body);
      
      const hmacKey = await crypto.subtle.importKey(
        "raw", key, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", hmacKey, data);
      const hash = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      
      if (hash !== signature) {
        console.error("Invalid signature");
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }
    }

    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { reference, metadata, amount } = event.data;
    const contestant_id = metadata?.contestant_id;

    if (!reference || !contestant_id) {
      console.error("Missing data in webhook payload");
      return new Response("Missing data", { status: 400, headers: corsHeaders });
    }

    // Server-side vote calculation from verified payment amount
    // amount from Paystack is in kobo, ₦100 = 10000 kobo = 1 vote
    const votes = Math.floor(amount / 10000);
    if (votes < 1) {
      console.error("Payment amount too low for votes");
      return new Response("Amount too low", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for duplicate processing
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, payment_status")
      .eq("transaction_reference", reference)
      .single();

    if (existingPayment?.payment_status === "verified") {
      return new Response("Already processed", { status: 200, headers: corsHeaders });
    }

    // Verify transaction with Paystack API
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      if (existingPayment) {
        await supabase.from("payments").update({ payment_status: "failed" }).eq("transaction_reference", reference);
      }
      return new Response("Payment not successful", { status: 400, headers: corsHeaders });
    }

    // Recalculate votes from verified amount
    const verifiedVotes = Math.floor(verifyData.data.amount / 10000);

    const paymentId = existingPayment?.id;
    if (paymentId) {
      await supabase.from("payments")
        .update({ payment_status: "verified", verified_at: new Date().toISOString(), votes_purchased: verifiedVotes })
        .eq("id", paymentId);

      await supabase.from("votes").insert({ contestant_id, payment_id: paymentId, votes_added: verifiedVotes });
      await supabase.rpc("increment_votes", { p_contestant_id: contestant_id, p_vote_count: verifiedVotes });
    } else {
      const { data: newPayment } = await supabase.from("payments").insert({
        email: verifyData.data.customer?.email || "unknown",
        amount: verifyData.data.amount / 100,
        votes_purchased: verifiedVotes,
        contestant_id,
        transaction_reference: reference,
        payment_status: "verified",
        verified_at: new Date().toISOString(),
      }).select("id").single();

      if (newPayment) {
        await supabase.from("votes").insert({ contestant_id, payment_id: newPayment.id, votes_added: verifiedVotes });
        await supabase.rpc("increment_votes", { p_contestant_id: contestant_id, p_vote_count: verifiedVotes });
      }
    }

    console.log(`Votes added: ${verifiedVotes} for contestant ${contestant_id}`);
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
