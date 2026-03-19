import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, Trophy, LogOut, Loader2, Vote,
  Calendar, Shield, TrendingUp, Activity,
} from "lucide-react";
import EventManager from "@/components/admin/EventManager";
import VoteMonitoringPanel from "@/components/admin/VoteMonitoringPanel";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventPayment {
  id: string;
  email: string;
  voter_name: string | null;
  amount: number;
  votes_purchased: number;
  transaction_reference: string;
  payment_status: string;
  created_at: string;
  event_id: string;
  contestant_id: string;
  event_contestants?: { name: string } | null;
  events?: { title: string } | null;
}

interface DashboardStats {
  totalEvents: number;
  liveEvents: number;
  totalVotes: number;
  totalFunds: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "payments" | "monitoring"
  >("overview");

  // Stats
  const [dashStats, setDashStats] = useState<DashboardStats>({
    totalEvents: 0,
    liveEvents: 0,
    totalVotes: 0,
    totalFunds: 0,
  });

  // Payments
  const [payments, setPayments] = useState<EventPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentEventFilter, setPaymentEventFilter] = useState<string>("all");
  const [eventOptions, setEventOptions] = useState<{ id: string; title: string }[]>([]);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin"); return; }
    const { data: roles } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) {
      await supabase.auth.signOut(); navigate("/admin"); return;
    }
    fetchDashboardStats();
    fetchEventOptions();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  // ── Fetch aggregate stats from events system ───────────────────────────────
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [eventsRes, contestantsRes, paymentsRes] = await Promise.all([
        supabase.from("events").select("id, status"),
        supabase.from("event_contestants").select("total_votes").eq("is_active", true),
        supabase.from("event_payments")
          .select("amount")
          .eq("payment_status", "verified"),
      ]);

      const events = eventsRes.data || [];
      const contestants = contestantsRes.data || [];
      const verifiedPayments = paymentsRes.data || [];

      const totalVotes = contestants.reduce(
        (sum: number, c: any) => sum + (c.total_votes || 0), 0
      );
      const totalFunds = verifiedPayments.reduce(
        (sum: number, p: any) => sum + (p.amount || 0), 0
      );

      setDashStats({
        totalEvents: events.length,
        liveEvents: events.filter((e: any) => e.status === "live").length,
        totalVotes,
        totalFunds,
      });
    } catch (err) {
      console.error("fetchDashboardStats error:", err);
    }
    setLoading(false);
  };

  // ── Fetch event options for payments filter ────────────────────────────────
  const fetchEventOptions = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title")
      .order("created_at", { ascending: false });
    if (data) setEventOptions(data);
  };

  // ── Fetch payments from events system ─────────────────────────────────────
  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      let query = supabase
        .from("event_payments")
        .select("*, event_contestants(name), events(title)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (paymentEventFilter !== "all") {
        query = query.eq("event_id", paymentEventFilter);
      }

      const { data } = await query;
      if (data) setPayments(data as EventPayment[]);
    } catch (err) {
      toast.error("Failed to load payments");
    }
    setPaymentsLoading(false);
  };

  // Fetch payments when tab opens or filter changes
  useEffect(() => {
    if (activeTab === "payments") fetchPayments();
  }, [activeTab, paymentEventFilter]);

  // ── Leaderboard across all events ─────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState<
    { name: string; event_title: string; total_votes: number; profile_image: string | null }[]
  >([]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("event_contestants")
      .select("name, total_votes, profile_image, events(title)")
      .eq("is_active", true)
      .order("total_votes", { ascending: false })
      .limit(10);
    if (data) {
      setLeaderboard(data.map((c: any) => ({
        name: c.name,
        event_title: c.events?.title || "—",
        total_votes: c.total_votes,
        profile_image: c.profile_image,
      })));
    }
  };

  useEffect(() => {
    if (activeTab === "overview") fetchLeaderboard();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="font-heading font-bold text-xl">ESSA Admin Panel</h1>
          <p className="text-primary-foreground/70 text-xs">Events & Voting Management</p>
        </div>
        <Button
          variant="ghost" size="sm" onClick={handleLogout}
          className="text-primary-foreground hover:text-primary-foreground/80"
        >
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>

      <div className="container max-w-screen-xl py-6 px-4">

        {/* ── Stats cards — all from events system ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{dashStats.totalEvents}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Live Now</p>
                <p className="text-2xl font-bold text-green-600">{dashStats.liveEvents}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-accent/10 p-3 rounded-full">
                <Vote className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold">{dashStats.totalVotes.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Funds Raised</p>
                <p className="text-2xl font-bold">₦{dashStats.totalFunds.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: "overview" as const, icon: TrendingUp, label: "Overview" },
            { key: "events" as const, icon: Calendar, label: "Events" },
            { key: "payments" as const, icon: DollarSign, label: "Payments" },
            { key: "monitoring" as const, icon: Shield, label: "Vote Monitoring" },
          ]).map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key)}
              size="sm"
            >
              <tab.icon className="h-4 w-4 mr-1" />{tab.label}
            </Button>
          ))}
        </div>

        {/* ── Overview Tab ──────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Top Contestants Across All Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No contestants yet. Create an event and add contestants to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Contestant</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Votes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <span className={`font-bold text-lg ${
                              i === 0 ? "text-accent" :
                              i === 1 ? "text-muted-foreground" :
                              "text-muted-foreground/60"
                            }`}>
                              #{i + 1}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {c.profile_image ? (
                                <img
                                  src={c.profile_image}
                                  alt={c.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <span className="font-medium">{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {c.event_title}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-accent">
                              {c.total_votes.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Events Tab ────────────────────────────────────────────────────── */}
        {activeTab === "events" && <EventManager />}

        {/* ── Vote Monitoring Tab ────────────────────────────────────────────── */}
        {activeTab === "monitoring" && <VoteMonitoringPanel />}

        {/* ── Payments Tab — from event_payments ────────────────────────────── */}
        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Payment History
                </CardTitle>
                {/* Event filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filter:</span>
                  <Select value={paymentEventFilter} onValueChange={setPaymentEventFilter}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {eventOptions.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No payments found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Contestant</TableHead>
                        <TableHead>Voter</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs max-w-32 truncate">
                            {(p.events as any)?.title || "—"}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {(p.event_contestants as any)?.name || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.voter_name || p.email}
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{p.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-bold text-accent">
                            {p.votes_purchased}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              p.payment_status === "verified"
                                ? "bg-green-100 text-green-700"
                                : p.payment_status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {p.payment_status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {p.transaction_reference.slice(0, 18)}…
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
