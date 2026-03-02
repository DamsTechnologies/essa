import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, voter_name, amount, contestant_id, payment_type } = await req.json();

    // Input validation
    if (!email || !amount || !contestant_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate contestant_id is UUID-like
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof contestant_id !== "string" || !uuidRegex.test(contestant_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid contestant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount (minimum ₦100 = 10000 kobo, max ₦1,000,000 = 100000000 kobo)
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 10000 || amount > 100000000) {
      return new Response(
        JSON.stringify({ error: "Invalid amount. Must be between ₦100 and ₦1,000,000" }),
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

    // Verify contestant exists and is active
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: contestantData } = await supabase
      .from("contestants")
      .select("id, is_active")
      .eq("id", contestant_id)
      .single();

    if (!contestantData || !contestantData.is_active) {
      return new Response(
        JSON.stringify({ error: "Contestant not found or inactive" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check contest is enabled
    const { data: settings } = await supabase
      .from("contest_settings")
      .select("is_enabled")
      .limit(1)
      .single();

    if (!settings?.is_enabled) {
      return new Response(
        JSON.stringify({ error: "Voting is currently closed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          voter_name: (typeof voter_name === "string" ? voter_name.slice(0, 100) : "") || "Anonymous",
          payment_type: payment_type === "custom" ? "custom" : "package",
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

    // Store payment with device metadata for audit
    await supabase.from("payments").insert({
      email,
      voter_name: (typeof voter_name === "string" ? voter_name.slice(0, 100) : null),
      amount: amount / 100,
      votes_purchased: serverCalculatedVotes,
      contestant_id,
      transaction_reference: reference,
      payment_status: "pending",
      ip_address: clientIp !== "unknown" ? clientIp : null,
      device_metadata: {
        user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
        origin: req.headers.get("origin") || null,
        referer: req.headers.get("referer") || null,
        timestamp: new Date().toISOString(),
      },
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
