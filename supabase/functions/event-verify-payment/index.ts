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
    const { reference, event_id } = await req.json();

    if (!reference || !event_id) {
      return new Response(JSON.stringify({ error: "Missing reference or event_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already verified
    const { data: existingPayment } = await supabase
      .from("event_payments")
      .select("id, payment_status")
      .eq("transaction_reference", reference)
      .single();

    if (existingPayment?.payment_status === "verified") {
      return new Response(JSON.stringify({ verified: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get event's paystack key
    const { data: event } = await supabase
      .from("events")
      .select("paystack_secret_key, vote_conversion_rate")
      .eq("id", event_id)
      .single();

    if (!event?.paystack_secret_key) {
      return new Response(JSON.stringify({ error: "Event payment not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${event.paystack_secret_key}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return new Response(JSON.stringify({ verified: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const conversionRateKobo = (event.vote_conversion_rate || 100) * 100;
    const verifiedVotes = Math.floor(verifyData.data.amount / conversionRateKobo);
    const contestant_id = verifyData.data.metadata?.contestant_id;

    if (verifiedVotes < 1 || !contestant_id) {
      return new Response(JSON.stringify({ verified: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (existingPayment && existingPayment.payment_status !== "verified") {
      const { error: updateError } = await supabase.from("event_payments")
        .update({
          payment_status: "verified",
          verified_at: new Date().toISOString(),
          votes_purchased: verifiedVotes,
        })
        .eq("id", existingPayment.id)
        .eq("payment_status", "pending");

      if (!updateError) {
        await supabase.from("event_monetary_votes").insert({
          event_id, contestant_id, payment_id: existingPayment.id, votes_added: verifiedVotes,
        });
        await supabase.rpc("increment_event_votes", { p_contestant_id: contestant_id, p_vote_count: verifiedVotes });
      }
    }

    return new Response(JSON.stringify({ verified: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Event verify error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
