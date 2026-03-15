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
    const { student_id, contestant_id, event_id } = await req.json();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!student_id || !contestant_id || !event_id ||
        !uuidRegex.test(student_id) || !uuidRegex.test(contestant_id) || !uuidRegex.test(event_id)) {
      return new Response(JSON.stringify({ error: "Invalid parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify student exists
    const { data: student } = await supabase.from("students").select("id").eq("id", student_id).single();
    if (!student) {
      return new Response(JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get event config
    const { data: event } = await supabase
      .from("events")
      .select("id, status, voting_type, vote_rule")
      .eq("id", event_id)
      .single();

    if (!event || event.status !== "live" || event.voting_type !== "free") {
      return new Response(JSON.stringify({ error: "Event not available for free voting" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify contestant belongs to event
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

    // Check duplicate vote based on vote_rule
    if (event.vote_rule === "per_event") {
      // Student can only vote once in the entire event
      const { data: existingVote } = await supabase
        .from("event_votes")
        .select("id")
        .eq("student_id", student_id)
        .eq("event_id", event_id)
        .limit(1)
        .single();

      if (existingVote) {
        return new Response(JSON.stringify({ error: "You have already voted in this event" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      // per_contestant: student can vote once per contestant
      const { data: existingVote } = await supabase
        .from("event_votes")
        .select("id")
        .eq("student_id", student_id)
        .eq("contestant_id", contestant_id)
        .eq("event_id", event_id)
        .limit(1)
        .single();

      if (existingVote) {
        return new Response(JSON.stringify({ error: "You have already voted for this contestant" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Insert vote
    const { error: voteError } = await supabase.from("event_votes").insert({
      student_id, contestant_id, event_id,
    });

    if (voteError) {
      console.error("Vote insert error:", voteError);
      return new Response(JSON.stringify({ error: "Failed to cast vote" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Increment vote count
    await supabase.rpc("increment_event_votes", { p_contestant_id: contestant_id, p_vote_count: 1 });

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Free vote error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
