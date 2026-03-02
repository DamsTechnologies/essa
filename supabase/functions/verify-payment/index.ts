import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();

    if (!reference || typeof reference !== "string" || reference.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already verified
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, payment_status, contestant_id")
      .eq("transaction_reference", reference)
      .single();

    if (existingPayment?.payment_status === "verified") {
      return new Response(
        JSON.stringify({ verified: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify with Paystack API directly
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return new Response(
        JSON.stringify({ verified: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate currency
    if (verifyData.data.currency !== "NGN") {
      console.error("Invalid currency:", verifyData.data.currency);
      return new Response(
        JSON.stringify({ verified: false, error: "Invalid currency" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Calculate votes server-side from verified amount only
    // Never trust metadata votes - always recalculate
    const verifiedAmountKobo = verifyData.data.amount;
    const verifiedVotes = Math.floor(verifiedAmountKobo / 10000);

    if (verifiedVotes < 1) {
      return new Response(
        JSON.stringify({ verified: false, error: "Amount too low" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contestant_id = verifyData.data.metadata?.contestant_id;
    if (!contestant_id) {
      console.error("Missing contestant_id in metadata");
      return new Response(
        JSON.stringify({ verified: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingPayment && existingPayment.payment_status !== "verified") {
      // Atomic update: mark verified and credit votes
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          payment_status: "verified",
          verified_at: new Date().toISOString(),
          votes_purchased: verifiedVotes,
        })
        .eq("id", existingPayment.id)
        .eq("payment_status", "pending"); // Optimistic lock

      if (updateError) {
        // If update fails, it was likely already processed
        return new Response(
          JSON.stringify({ verified: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("votes").insert({
        contestant_id,
        payment_id: existingPayment.id,
        votes_added: verifiedVotes,
      });

      await supabase.rpc("increment_votes", {
        p_contestant_id: contestant_id,
        p_vote_count: verifiedVotes,
      });
    }

    return new Response(
      JSON.stringify({ verified: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
