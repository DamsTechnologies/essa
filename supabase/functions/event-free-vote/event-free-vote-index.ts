import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Fraud detection thresholds ───────────────────────────────────────────────
const SAME_IP_WINDOW_MINUTES = 10;
const SAME_IP_MAX_VOTES = 3; // flag if same IP votes more than this in the window

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student_id, contestant_id, event_id } = await req.json();

    // ── Input validation ──────────────────────────────────────────────────────
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      !student_id || !contestant_id || !event_id ||
      !uuidRegex.test(student_id) || !uuidRegex.test(contestant_id) || !uuidRegex.test(event_id)
    ) {
      return new Response(JSON.stringify({ error: "Invalid parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Extract request metadata for fraud detection ──────────────────────────
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Verify student exists ─────────────────────────────────────────────────
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("id", student_id)
      .single();

    if (!student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get event config ──────────────────────────────────────────────────────
    const { data: event } = await supabase
      .from("events")
      .select("id, status, voting_type, vote_rule, voting_paused")
      .eq("id", event_id)
      .single();

    if (!event || event.status !== "live" || event.voting_type !== "free") {
      return new Response(JSON.stringify({ error: "Event not available for free voting" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Check if voting is paused ─────────────────────────────────────────────
    if (event.voting_paused) {
      return new Response(JSON.stringify({ error: "Voting has been temporarily paused for this event" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Verify contestant belongs to event ────────────────────────────────────
    const { data: contestant } = await supabase
      .from("event_contestants")
      .select("id, is_active")
      .eq("id", contestant_id)
      .eq("event_id", event_id)
      .single();

    if (!contestant || !contestant.is_active) {
      return new Response(JSON.stringify({ error: "Contestant not found or inactive" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Check duplicate vote based on vote_rule ───────────────────────────────
    if (event.vote_rule === "per_event") {
      const { data: existingVote } = await supabase
        .from("event_votes")
        .select("id")
        .eq("student_id", student_id)
        .eq("event_id", event_id)
        .limit(1)
        .single();

      if (existingVote) {
        return new Response(JSON.stringify({ error: "You have already voted in this event" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { data: existingVote } = await supabase
        .from("event_votes")
        .select("id")
        .eq("student_id", student_id)
        .eq("contestant_id", contestant_id)
        .eq("event_id", event_id)
        .limit(1)
        .single();

      if (existingVote) {
        return new Response(JSON.stringify({ error: "You have already voted for this contestant" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Fraud detection: check IP vote rate in last N minutes ─────────────────
    let isSuspicious = false;
    let flaggedReason = "";

    if (ipAddress !== "unknown") {
      const windowStart = new Date(
        Date.now() - SAME_IP_WINDOW_MINUTES * 60 * 1000
      ).toISOString();

      const { count } = await supabase
        .from("event_votes")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ipAddress)
        .gte("created_at", windowStart);

      if ((count ?? 0) >= SAME_IP_MAX_VOTES) {
        isSuspicious = true;
        flaggedReason = `IP ${ipAddress} cast ${(count ?? 0) + 1} votes within ${SAME_IP_WINDOW_MINUTES} minutes`;
      }
    }

    // ── Insert vote with metadata ─────────────────────────────────────────────
    const { data: newVote, error: voteError } = await supabase
      .from("event_votes")
      .insert({
        student_id,
        contestant_id,
        event_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        suspicious_activity: isSuspicious,
        flagged_reason: flaggedReason || null,
      })
      .select("id")
      .single();

    if (voteError) {
      console.error("Vote insert error:", voteError);
      return new Response(JSON.stringify({ error: "Failed to cast vote" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Increment vote count ──────────────────────────────────────────────────
    await supabase.rpc("increment_event_votes", {
      p_contestant_id: contestant_id,
      p_vote_count: 1,
    });

    // ── If suspicious, log to audit trail ─────────────────────────────────────
    if (isSuspicious && newVote) {
      await supabase.from("vote_audit_log").insert({
        action: "auto_flag_suspicious",
        admin_id: "system",
        event_id,
        vote_id: newVote.id,
        contestant_id,
        details: flaggedReason,
      });
    }

    return new Response(
      JSON.stringify({ success: true, suspicious: isSuspicious }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Free vote error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
