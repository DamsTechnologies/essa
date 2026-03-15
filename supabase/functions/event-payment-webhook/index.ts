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
    const body = await req.text();
    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const { reference, metadata, amount, currency } = event.data;
    const event_id = metadata?.event_id;
    const contestant_id = metadata?.contestant_id;

    if (!reference || !event_id || !contestant_id) {
      console.error("Missing data in event webhook payload");
      return new Response("Missing data", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get event config for signature verification and vote calculation
    const { data: eventConfig } = await supabase
      .from("events")
      .select("paystack_secret_key, vote_conversion_rate")
      .eq("id", event_id)
      .single();

    if (!eventConfig?.paystack_secret_key) {
      console.error("Event not found or no paystack key:", event_id);
      return new Response("Event not configured", { status: 400, headers: corsHeaders });
    }

    // Verify signature with event-specific secret key
    const signature = req.headers.get("x-paystack-signature");
    if (signature) {
      const encoder = new TextEncoder();
      const key = encoder.encode(eventConfig.paystack_secret_key);
      const data = encoder.encode(body);
      const hmacKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", hmacKey, data);
      const hash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

      if (hash !== signature) {
        console.error("Invalid event webhook signature");
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }
    }

    // Check duplicate
    const { data: existingPayment } = await supabase
      .from("event_payments")
      .select("id, payment_status")
      .eq("transaction_reference", reference)
      .single();

    if (existingPayment?.payment_status === "verified") {
      return new Response("Already processed", { status: 200, headers: corsHeaders });
    }

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${eventConfig.paystack_secret_key}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      if (existingPayment) {
        await supabase.from("event_payments").update({ payment_status: "failed" }).eq("transaction_reference", reference);
      }
      return new Response("Payment not successful", { status: 400, headers: corsHeaders });
    }

    // Calculate votes using event-specific conversion rate
    const conversionRateKobo = (eventConfig.vote_conversion_rate || 100) * 100;
    const verifiedVotes = Math.floor(verifyData.data.amount / conversionRateKobo);

    if (verifiedVotes < 1) {
      return new Response("Amount too low", { status: 400, headers: corsHeaders });
    }

    if (existingPayment) {
      const { error: updateError } = await supabase.from("event_payments")
        .update({
          payment_status: "verified",
          verified_at: new Date().toISOString(),
          votes_purchased: verifiedVotes,
        })
        .eq("id", existingPayment.id)
        .eq("payment_status", "pending");

      if (updateError) {
        return new Response("Already processed", { status: 200, headers: corsHeaders });
      }

      await supabase.from("event_monetary_votes").insert({
        event_id, contestant_id, payment_id: existingPayment.id, votes_added: verifiedVotes,
      });
      await supabase.rpc("increment_event_votes", { p_contestant_id: contestant_id, p_vote_count: verifiedVotes });
    } else {
      const { data: newPayment } = await supabase.from("event_payments").insert({
        email: verifyData.data.customer?.email || "unknown",
        amount: verifyData.data.amount / 100,
        votes_purchased: verifiedVotes,
        contestant_id, event_id,
        transaction_reference: reference,
        payment_status: "verified",
        verified_at: new Date().toISOString(),
      }).select("id").single();

      if (newPayment) {
        await supabase.from("event_monetary_votes").insert({
          event_id, contestant_id, payment_id: newPayment.id, votes_added: verifiedVotes,
        });
        await supabase.rpc("increment_event_votes", { p_contestant_id: contestant_id, p_vote_count: verifiedVotes });
      }
    }

    console.log(`Event votes added: ${verifiedVotes} for contestant ${contestant_id} in event ${event_id}`);
    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Event webhook error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
