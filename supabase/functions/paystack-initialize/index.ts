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
    const { email, voter_name, amount, votes, contestant_id, payment_type } = await req.json();

    if (!email || !amount || !contestant_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount (minimum ₦100 = 10000 kobo)
    if (amount < 10000 || amount > 100000000) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side vote calculation: ₦100 = 1 vote (amount is in kobo)
    const serverCalculatedVotes = Math.floor(amount / 10000);
    if (serverCalculatedVotes < 1) {
      return new Response(
        JSON.stringify({ error: "Amount too low for any votes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reference = `vote_${contestant_id.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Determine callback URL - use production domain
    const origin = req.headers.get("origin") || "https://theessa.vercel.app";
    const callbackUrl = `${origin}/competition?payment=success`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        currency: "NGN",
        metadata: {
          contestant_id,
          votes: serverCalculatedVotes,
          voter_name: voter_name || "Anonymous",
          payment_type: payment_type || "package",
        },
        callback_url: callbackUrl,
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return new Response(
        JSON.stringify({ error: "Failed to initialize payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("payments").insert({
      email,
      voter_name: voter_name || null,
      amount: amount / 100,
      votes_purchased: serverCalculatedVotes,
      contestant_id,
      transaction_reference: reference,
      payment_status: "pending",
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
    });

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment init error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
