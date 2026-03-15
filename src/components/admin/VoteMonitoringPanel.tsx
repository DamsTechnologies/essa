import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, Shield, Activity, Trash2, Flag, CheckCircle,
  Pause, Play, RefreshCw, Upload, Loader2, Eye,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SuspiciousVote {
  id: string;
  event_id: string;
  contestant_id: string;
  student_id: string;
  ip_address: string | null;
  user_agent: string | null;
  suspicious_activity: boolean;
  flagged_reason: string | null;
  reviewed_by_admin: boolean;
  created_at: string;
  event_contestants?: { name: string } | null;
  events?: { title: string } | null;
}

interface AuditEntry {
  id: string;
  action: string;
  admin_id: string;
  event_id: string | null;
  vote_id: string | null;
  details: string | null;
  created_at: string;
}

interface WhitelistEntry {
  id: string;
  matric_number: string;
  created_at: string;
}

interface EventOption {
  id: string;
  title: string;
  status: string;
  voting_paused: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const VoteMonitoringPanel = () => {
  const [activeTab, setActiveTab] = useState<"suspicious" | "audit" | "whitelist">("suspicious");
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [suspiciousVotes, setSuspiciousVotes] = useState<SuspiciousVote[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string>("");

  // Whitelist bulk import
  const [bulkMatrics, setBulkMatrics] = useState("");
  const [importing, setImporting] = useState(false);
  const [whitelistSearch, setWhitelistSearch] = useState("");

  // ── Get current admin user ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminId(data.user.id);
    });
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedEventId, activeTab]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, status, voting_paused")
      .order("created_at", { ascending: false });
    if (data) setEvents(data as EventOption[]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (activeTab === "suspicious") await fetchSuspiciousVotes();
    if (activeTab === "audit") await fetchAuditLog();
    if (activeTab === "whitelist") await fetchWhitelist();
    setLoading(false);
  }, [activeTab, selectedEventId]);

  const fetchSuspiciousVotes = async () => {
    let query = supabase
      .from("event_votes")
      .select("*, event_contestants(name), events(title)")
      .eq("suspicious_activity", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (selectedEventId !== "all") {
      query = query.eq("event_id", selectedEventId);
    }

    const { data } = await query;
    if (data) setSuspiciousVotes(data as SuspiciousVote[]);
  };

  const fetchAuditLog = async () => {
    const { data } = await supabase
      .from("vote_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setAuditLog(data as AuditEntry[]);
  };

  const fetchWhitelist = async () => {
    let query = supabase
      .from("student_whitelist")
      .select("*")
      .order("created_at", { ascending: false });
    const { data } = await query;
    if (data) setWhitelist(data as WhitelistEntry[]);
  };

  // ── Admin actions ───────────────────────────────────────────────────────────

  const handleMarkReviewed = async (vote: SuspiciousVote) => {
    const { error } = await supabase
      .from("event_votes")
      .update({ reviewed_by_admin: true, suspicious_activity: false })
      .eq("id", vote.id);

    if (error) { toast.error("Failed to update"); return; }

    await supabase.from("vote_audit_log").insert({
      action: "unflag_vote",
      admin_id: adminId,
      event_id: vote.event_id,
      vote_id: vote.id,
      contestant_id: vote.contestant_id,
      details: `Admin marked vote ${vote.id} as reviewed (cleared suspicious flag)`,
    });

    toast.success("Vote marked as reviewed");
    fetchSuspiciousVotes();
  };

  const handleDeleteVote = async (vote: SuspiciousVote) => {
    if (!confirm("Delete this vote? This will also decrement the contestant's vote count.")) return;

    // Decrement contestant vote count
    await supabase.rpc("increment_event_votes", {
      p_contestant_id: vote.contestant_id,
      p_vote_count: -1,
    });

    const { error } = await supabase.from("event_votes").delete().eq("id", vote.id);
    if (error) { toast.error("Failed to delete vote"); return; }

    await supabase.from("vote_audit_log").insert({
      action: "delete_vote",
      admin_id: adminId,
      event_id: vote.event_id,
      vote_id: vote.id,
      contestant_id: vote.contestant_id,
      details: `Admin deleted suspicious vote. Reason: ${vote.flagged_reason || "manual review"}`,
    });

    toast.success("Vote deleted and count adjusted");
    fetchSuspiciousVotes();
  };

  const handleTogglePause = async (event: EventOption) => {
    const newPaused = !event.voting_paused;
    const { error } = await supabase
      .from("events")
      .update({ voting_paused: newPaused })
      .eq("id", event.id);

    if (error) { toast.error("Failed to update"); return; }

    await supabase.from("vote_audit_log").insert({
      action: newPaused ? "pause_event" : "resume_event",
      admin_id: adminId,
      event_id: event.id,
      details: `Admin ${newPaused ? "paused" : "resumed"} voting for event: ${event.title}`,
    });

    toast.success(`Voting ${newPaused ? "paused" : "resumed"} for ${event.title}`);
    fetchEvents();
  };

  // ── Whitelist bulk import ────────────────────────────────────────────────────

  const handleBulkImport = async () => {
    const lines = bulkMatrics
      .split(/[\n,]/)
      .map((l) => l.trim().toUpperCase())
      .filter((l) => l.length > 0);

    if (lines.length === 0) { toast.error("No matric numbers found"); return; }

    // Basic format validation before insert
    const MATRIC_REGEX = /^\d{2}[A-Z]{2}\d{9}$/;
    const invalid = lines.filter((l) => !MATRIC_REGEX.test(l));
    if (invalid.length > 0) {
      toast.error(`${invalid.length} entries have invalid format. First: ${invalid[0]}`);
      return;
    }

    setImporting(true);
    const rows = lines.map((m) => ({ matric_number: m, added_by: adminId }));

    // Upsert — ignore duplicates
    const { error } = await supabase
      .from("student_whitelist")
      .upsert(rows, { onConflict: "matric_number" });

    if (error) { toast.error("Import failed: " + error.message); setImporting(false); return; }

    await supabase.from("vote_audit_log").insert({
      action: "whitelist_import",
      admin_id: adminId,
      details: `Admin imported ${lines.length} matric numbers to whitelist`,
    });

    toast.success(`${lines.length} matric numbers imported`);
    setBulkMatrics("");
    fetchWhitelist();
    setImporting(false);
  };

  const handleDeleteWhitelistEntry = async (id: string, matric: string) => {
    if (!confirm(`Remove ${matric} from whitelist?`)) return;
    const { error } = await supabase.from("student_whitelist").delete().eq("id", id);
    if (error) { toast.error("Failed to remove"); return; }
    toast.success("Removed from whitelist");
    fetchWhitelist();
  };

  // ── Action badge colour ──────────────────────────────────────────────────────

  const actionColor = (action: string) => {
    if (action.includes("delete")) return "bg-red-100 text-red-700";
    if (action.includes("pause")) return "bg-yellow-100 text-yellow-700";
    if (action.includes("resume")) return "bg-green-100 text-green-700";
    if (action.includes("flag") || action.includes("auto")) return "bg-orange-100 text-orange-700";
    if (action.includes("whitelist")) return "bg-blue-100 text-blue-700";
    return "bg-muted text-muted-foreground";
  };

  const filteredWhitelist = whitelist.filter((w) =>
    w.matric_number.includes(whitelistSearch.toUpperCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Vote Monitoring
        </h2>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* ── Event pause controls ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Pause className="h-4 w-4" /> Event Voting Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.filter((e) => e.status === "live").map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.voting_paused ? "⚠️ Voting is currently PAUSED" : "✅ Voting is active"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={e.voting_paused ? "default" : "outline"}
                  onClick={() => handleTogglePause(e)}
                >
                  {e.voting_paused
                    ? <><Play className="h-3 w-3 mr-1" /> Resume</>
                    : <><Pause className="h-3 w-3 mr-1" /> Pause</>
                  }
                </Button>
              </div>
            ))}
            {events.filter((e) => e.status === "live").length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No live events right now.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "suspicious" as const, icon: AlertTriangle, label: "Suspicious Votes" },
          { key: "audit" as const, icon: Activity, label: "Audit Log" },
          { key: "whitelist" as const, icon: Shield, label: "Student Whitelist" },
        ]).map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={activeTab === tab.key ? "default" : "outline"}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="h-3.5 w-3.5 mr-1" />
            {tab.label}
            {tab.key === "suspicious" && suspiciousVotes.length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                {suspiciousVotes.filter((v) => !v.reviewed_by_admin).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* ── Event filter (suspicious tab) ───────────────────────────────────── */}
      {activeTab === "suspicious" && (
        <div className="flex items-center gap-3">
          <Label className="text-sm shrink-0">Filter by event:</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Suspicious Votes */}
          {activeTab === "suspicious" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Suspicious Vote Activity
                  {suspiciousVotes.length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {suspiciousVotes.filter((v) => !v.reviewed_by_admin).length} unreviewed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suspiciousVotes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    ✅ No suspicious activity detected
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Contestant</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suspiciousVotes.map((vote) => (
                          <TableRow key={vote.id} className={vote.reviewed_by_admin ? "opacity-50" : ""}>
                            <TableCell className="text-xs">{(vote.events as any)?.title || "—"}</TableCell>
                            <TableCell className="font-medium text-sm">
                              {(vote.event_contestants as any)?.name || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{vote.ip_address || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-48 truncate">
                              {vote.flagged_reason || "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(vote.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {vote.reviewed_by_admin ? (
                                <Badge variant="outline" className="text-xs">Reviewed</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!vote.reviewed_by_admin && (
                                  <Button size="icon" variant="ghost" title="Mark as reviewed"
                                    onClick={() => handleMarkReviewed(vote)}>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" title="Delete vote"
                                  onClick={() => handleDeleteVote(vote)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
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

          {/* Audit Log */}
          {activeTab === "audit" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Admin Action Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLog.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No admin actions recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLog.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColor(entry.action)}`}>
                                {entry.action.replace(/_/g, " ")}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-64 truncate">
                              {entry.details || "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(entry.created_at).toLocaleString()}
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

          {/* Whitelist Manager */}
          {activeTab === "whitelist" && (
            <div className="space-y-4">
              {/* Bulk import */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Import Matric Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Paste matric numbers below — one per line or comma-separated. Only students on this list can register.
                  </p>
                  <Textarea
                    value={bulkMatrics}
                    onChange={(e) => setBulkMatrics(e.target.value)}
                    placeholder={"24EF021030001\n24EF021030002\n23AB021030003"}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleBulkImport} disabled={importing || !bulkMatrics.trim()}>
                    {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <Upload className="h-4 w-4 mr-2" /> Import to Whitelist
                  </Button>
                </CardContent>
              </Card>

              {/* Whitelist table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Whitelisted Students ({whitelist.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <Input
                      placeholder="Search matric number..."
                      value={whitelistSearch}
                      onChange={(e) => setWhitelistSearch(e.target.value)}
                      className="max-w-xs font-mono"
                    />
                  </div>
                  {filteredWhitelist.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      {whitelist.length === 0 ? "No matric numbers imported yet." : "No results found."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Matric Number</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredWhitelist.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-mono font-medium">{entry.matric_number}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost"
                                  onClick={() => handleDeleteWhitelistEntry(entry.id, entry.matric_number)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VoteMonitoringPanel;
