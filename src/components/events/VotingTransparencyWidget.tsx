import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vote, Users, Clock, Activity, DollarSign } from "lucide-react";

interface ActivityEntry {
  id: string;
  contestant_name: string;
  created_at: string;
}

interface TransparencyStats {
  totalVotes: number;
  uniqueVoters: number;
  lastVoteAt: string | null;
  totalFunds: number;
}

interface Props {
  eventId: string;
  votingType: "monetary" | "free";
  isLive: boolean;
  showFundsRaised?: boolean; // ← admin-controlled toggle (default true)
}

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const VotingTransparencyWidget = ({
  eventId,
  votingType,
  isLive,
  showFundsRaised = true,
}: Props) => {
  const [stats, setStats] = useState<TransparencyStats>({
    totalVotes: 0,
    uniqueVoters: 0,
    lastVoteAt: null,
    totalFunds: 0,
  });
  const [feed, setFeed] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (votingType === "free") {
      const [votesRes, uniqueRes, lastRes] = await Promise.all([
        supabase
          .from("event_votes")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId),
        supabase
          .from("event_votes")
          .select("student_id")
          .eq("event_id", eventId),
        supabase
          .from("event_votes")
          .select("created_at")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

      const uniqueVoters = new Set(
        (uniqueRes.data || []).map((v: any) => v.student_id)
      ).size;

      setStats({
        totalVotes: votesRes.count || 0,
        uniqueVoters,
        lastVoteAt: lastRes.data?.created_at || null,
        totalFunds: 0,
      });
    } else {
      const [paymentsRes, lastRes] = await Promise.all([
        supabase
          .from("event_payments")
          .select("votes_purchased, amount")
          .eq("event_id", eventId)
          .eq("payment_status", "verified"),
        supabase
          .from("event_payments")
          .select("created_at")
          .eq("event_id", eventId)
          .eq("payment_status", "verified")
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

      const payments = paymentsRes.data || [];
      const totalVotes = payments.reduce((s: number, p: any) => s + p.votes_purchased, 0);
      const totalFunds = payments.reduce((s: number, p: any) => s + p.amount, 0);

      setStats({
        totalVotes,
        uniqueVoters: payments.length,
        lastVoteAt: lastRes.data?.created_at || null,
        totalFunds,
      });
    }
  };

  const fetchFeed = async () => {
    const { data } = await supabase
      .from("event_votes")
      .select("id, created_at, contestant_id, event_contestants(name)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(15);

    if (data) {
      setFeed(
        data.map((v: any) => ({
          id: v.id,
          contestant_name: v.event_contestants?.name || "a contestant",
          created_at: v.created_at,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    fetchFeed();

    if (!isLive) return;

    const channel = supabase
      .channel(`transparency-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_votes",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          setStats((prev) => ({
            ...prev,
            totalVotes: prev.totalVotes + 1,
            lastVoteAt: (payload.new as any).created_at,
          }));

          const { data: c } = await supabase
            .from("event_contestants")
            .select("name")
            .eq("id", (payload.new as any).contestant_id)
            .single();

          const newEntry: ActivityEntry = {
            id: (payload.new as any).id,
            contestant_name: c?.name || "a contestant",
            created_at: (payload.new as any).created_at,
          };

          setFeed((prev) => [newEntry, ...prev].slice(0, 15));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, isLive, votingType]);

  // Decide how many stat columns to show
  const showFunds = votingType === "monetary" && showFundsRaised;

  return (
    <div className="space-y-4">
      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            Voting Activity
            {isLive && (
              <Badge variant="default" className="text-xs ml-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block mr-1" />
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${showFunds ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"}`}>

            {/* Total Votes */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Vote className="h-3.5 w-3.5" />
                <span className="text-xs">Total Votes</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalVotes.toLocaleString()}
              </p>
            </div>

            {/* Participants */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">Participants</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.uniqueVoters.toLocaleString()}
              </p>
            </div>

            {/* Funds Raised — only shown when admin toggles it ON for monetary events */}
            {showFunds && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs">Funds Raised</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ₦{stats.totalFunds.toLocaleString()}
                </p>
              </div>
            )}

            {/* Last Vote */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">Last Vote</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {stats.lastVoteAt ? formatTimeAgo(stats.lastVoteAt) : "No votes yet"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Live activity feed (free voting only) ─────────────────────────── */}
      {votingType === "free" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : feed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No votes yet. Be the first to vote!
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {feed.map((entry, i) => (
                  <li
                    key={entry.id}
                    className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg transition-colors ${
                      i === 0
                        ? "bg-accent/10 border border-accent/20"
                        : "bg-muted/40"
                    }`}
                  >
                    <span className="text-foreground">
                      🗳️ A vote was cast for{" "}
                      <span className="font-semibold">{entry.contestant_name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatTimeAgo(entry.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VotingTransparencyWidget;
