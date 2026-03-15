import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
    return false;
  }
  entry.count++;
  return entry.count > 10;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { email, voter_name, amount, contestant_id, event_id, payment_type } = await req.json();

    if (!email || !amount || !contestant_id || !event_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contestant_id) || !uuidRegex.test(event_id)) {
      return new Response(JSON.stringify({ error: "Invalid IDs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 10000 || amount > 100000000) {
      return new Response(JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get event with its payment config
    const { data: event } = await supabase
      .from("events")
      .select("id, status, voting_type, paystack_secret_key, payment_currency, vote_conversion_rate, min_vote_amount")
      .eq("id", event_id)
      .single();

    if (!event || event.status !== "live" || event.voting_type !== "monetary") {
      return new Response(JSON.stringify({ error: "Event not available for monetary voting" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!event.paystack_secret_key) {
      return new Response(JSON.stringify({ error: "Payment not configured for this event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate minimum amount (convert to kobo)
    const minAmountKobo = (event.min_vote_amount || 100) * 100;
    if (amount < minAmountKobo) {
      return new Response(JSON.stringify({ error: `Minimum amount is ₦${event.min_vote_amount}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Calculate votes using event-specific conversion rate
    const conversionRateKobo = (event.vote_conversion_rate || 100) * 100;
    const serverCalculatedVotes = Math.floor(amount / conversionRateKobo);
    if (serverCalculatedVotes < 1) {
      return new Response(JSON.stringify({ error: "Amount too low for any votes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify contestant exists and belongs to event
    const { data: contestant } = await supabase
      .from("event_contestants")
      .select("id, is_active")
      .eq("id", contestant_id)
      .eq("event_id", event_id)
      .single();

    if (!contestant || !contestant.is_active) {
      return new Response(JSON.stringify({ error: "Contestant not found or inactive" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const reference = `ev_${event_id.slice(0, 8)}_${contestant_id.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const origin = req.headers.get("origin") || "https://theessa.vercel.app";
    const callbackUrl = `${origin}/events-hub/${event_id}?payment=success`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${event.paystack_secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        currency: event.payment_currency || "NGN",
        metadata: {
          event_id,
          contestant_id,
          votes: serverCalculatedVotes,
          voter_name: (typeof voter_name === "string" ? voter_name.slice(0, 100) : "") || "Anonymous",
          payment_type: payment_type === "custom" ? "custom" : "package",
        },
        callback_url: callbackUrl,
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      console.error("Paystack init failed:", paystackData);
      return new Response(JSON.stringify({ error: "Failed to initialize payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Store payment record
    await supabase.from("event_payments").insert({
      email,
      voter_name: typeof voter_name === "string" ? voter_name.slice(0, 100) : null,
      amount: amount / 100,
      votes_purchased: serverCalculatedVotes,
      contestant_id,
      event_id,
      transaction_reference: reference,
      payment_status: "pending",
      ip_address: clientIp !== "unknown" ? clientIp : null,
      device_metadata: {
        user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
        origin: req.headers.get("origin") || null,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(JSON.stringify({
      authorization_url: paystackData.data.authorization_url,
      reference,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Event payment init error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
