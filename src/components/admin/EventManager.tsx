import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, Edit, Loader2, Calendar, Users, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import EventContestantManager from "./EventContestantManager";
import EventAnalytics from "./EventAnalytics";

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  banner_image: string | null;
  voting_type: "monetary" | "free";
  status: "draft" | "live" | "ended";
  vote_rule: "per_contestant" | "per_event";
  start_date: string | null;
  end_date: string | null;
  paystack_public_key: string | null;
  paystack_secret_key: string | null;
  payment_currency: string;
  min_vote_amount: number;
  vote_conversion_rate: number;
  created_at: string;
}

const EventManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [managingEvent, setManagingEvent] = useState<Event | null>(null);
  const [analyticsEvent, setAnalyticsEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formVotingType, setFormVotingType] = useState<"monetary" | "free">("free");
  const [formVoteRule, setFormVoteRule] = useState<"per_contestant" | "per_event">("per_contestant");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formBannerImage, setFormBannerImage] = useState<File | null>(null);
  const [formBannerUrl, setFormBannerUrl] = useState("");
  // Monetary config
  const [formPaystackPublicKey, setFormPaystackPublicKey] = useState("");
  const [formPaystackSecretKey, setFormPaystackSecretKey] = useState("");
  const [formCurrency, setFormCurrency] = useState("NGN");
  const [formMinAmount, setFormMinAmount] = useState("100");
  const [formConversionRate, setFormConversionRate] = useState("100");

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEvents(data as Event[]);
    if (error) toast.error("Failed to load events");
    setLoading(false);
  };

  const resetForm = () => {
    setFormTitle(""); setFormDescription(""); setFormCategory("");
    setFormVotingType("free"); setFormVoteRule("per_contestant");
    setFormStartDate(""); setFormEndDate("");
    setFormBannerImage(null); setFormBannerUrl("");
    setFormPaystackPublicKey(""); setFormPaystackSecretKey("");
    setFormCurrency("NGN"); setFormMinAmount("100"); setFormConversionRate("100");
    setEditingEvent(null); setShowDialog(false);
  };

  const openEditDialog = (e: Event) => {
    setEditingEvent(e);
    setFormTitle(e.title);
    setFormDescription(e.description || "");
    setFormCategory(e.category || "");
    setFormVotingType(e.voting_type);
    setFormVoteRule(e.vote_rule);
    setFormStartDate(e.start_date ? new Date(e.start_date).toISOString().slice(0, 16) : "");
    setFormEndDate(e.end_date ? new Date(e.end_date).toISOString().slice(0, 16) : "");
    setFormBannerUrl(e.banner_image || "");
    setFormPaystackPublicKey(e.paystack_public_key || "");
    setFormPaystackSecretKey(e.paystack_secret_key || "");
    setFormCurrency(e.payment_currency);
    setFormMinAmount(String(e.min_vote_amount));
    setFormConversionRate(String(e.vote_conversion_rate));
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("Event title is required"); return; }
    setSaving(true);

    try {
      let bannerUrl = formBannerUrl;
      if (formBannerImage) {
        if (formBannerImage.size > 2 * 1024 * 1024) { toast.error("Banner image must be under 2MB"); setSaving(false); return; }
        const ext = formBannerImage.name.split(".").pop();
        const fileName = `event_banner_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("contestant-images").upload(fileName, formBannerImage);
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from("contestant-images").getPublicUrl(fileName);
        bannerUrl = pub.publicUrl;
      }

      const payload: Record<string, any> = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        category: formCategory.trim() || null,
        banner_image: bannerUrl || null,
        voting_type: formVotingType,
        vote_rule: formVoteRule,
        start_date: formStartDate ? new Date(formStartDate).toISOString() : null,
        end_date: formEndDate ? new Date(formEndDate).toISOString() : null,
        payment_currency: formCurrency,
        min_vote_amount: parseInt(formMinAmount) || 100,
        vote_conversion_rate: parseInt(formConversionRate) || 100,
      };

      if (formVotingType === "monetary") {
        payload.paystack_public_key = formPaystackPublicKey.trim() || null;
        payload.paystack_secret_key = formPaystackSecretKey.trim() || null;
      }

      if (editingEvent) {
        const { error } = await supabase.from("events").update(payload).eq("id", editingEvent.id);
        if (error) throw error;
        toast.success("Event updated");
      } else {
        const { error } = await supabase.from("events").insert([payload] as any);
        if (error) throw error;
        toast.success("Event created");
      }

      resetForm();
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save event");
    }
    setSaving(false);
  };

  const handleStatusChange = async (event: Event, newStatus: "draft" | "live" | "ended") => {
    const { error } = await supabase.from("events").update({ status: newStatus }).eq("id", event.id);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Event ${newStatus === "live" ? "activated" : newStatus}`); fetchEvents(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event and all its contestants/votes?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error("Failed to delete event");
    else { toast.success("Event deleted"); fetchEvents(); }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      live: "bg-green-100 text-green-700",
      ended: "bg-red-100 text-red-700",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || ""}`}>{status}</span>;
  };

  if (managingEvent) {
    return (
      <div>
        <Button variant="outline" size="sm" className="mb-4" onClick={() => setManagingEvent(null)}>
          ← Back to Events
        </Button>
        <EventContestantManager event={managingEvent} />
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Event Management</CardTitle>
        <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowDialog(open); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create Event</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit" : "Create"} Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Event Title *</Label><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} maxLength={200} placeholder="e.g. Best Native Dressed 2026" /></div>
              <div><Label>Description</Label><Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} maxLength={2000} rows={3} placeholder="Describe the event..." /></div>
              <div><Label>Category</Label><Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} maxLength={100} placeholder="e.g. Fashion, Talent, Cultural" /></div>
              <div>
                <Label>Banner Image</Label>
                <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFormBannerImage(e.target.files?.[0] || null)} />
                {formBannerUrl && !formBannerImage && <img src={formBannerUrl} alt="Banner" className="mt-2 h-20 rounded object-cover w-full" />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="datetime-local" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} /></div>
                <div><Label>End Date</Label><Input type="datetime-local" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} /></div>
              </div>

              <div>
                <Label>Voting Type *</Label>
                <Select value={formVotingType} onValueChange={(v: "monetary" | "free") => setFormVotingType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Student Voting</SelectItem>
                    <SelectItem value="monetary">Monetary Voting (Paystack)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formVotingType === "free" && (
                <div>
                  <Label>Vote Rule</Label>
                  <Select value={formVoteRule} onValueChange={(v: "per_contestant" | "per_event") => setFormVoteRule(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_contestant">One vote per contestant</SelectItem>
                      <SelectItem value="per_event">One vote per event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formVotingType === "monetary" && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground">Payment Configuration</p>
                  <div><Label>Paystack Public Key</Label><Input value={formPaystackPublicKey} onChange={(e) => setFormPaystackPublicKey(e.target.value)} placeholder="pk_live_..." /></div>
                  <div><Label>Paystack Secret Key</Label><Input type="password" value={formPaystackSecretKey} onChange={(e) => setFormPaystackSecretKey(e.target.value)} placeholder="sk_live_..." /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label>Currency</Label><Input value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} /></div>
                    <div><Label>Min Amount</Label><Input type="number" value={formMinAmount} onChange={(e) => setFormMinAmount(e.target.value)} /></div>
                    <div><Label>₦ per Vote</Label><Input type="number" value={formConversionRate} onChange={(e) => setFormConversionRate(e.target.value)} /></div>
                  </div>
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingEvent ? "Update" : "Create"} Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No events yet. Create your first event!</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{e.title}</p>
                        {e.category && <p className="text-xs text-muted-foreground">{e.category}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${e.voting_type === "monetary" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                        {e.voting_type === "monetary" ? "Paid" : "Free"}
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(e.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.start_date ? new Date(e.start_date).toLocaleDateString() : "—"}
                      {" → "}
                      {e.end_date ? new Date(e.end_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => setManagingEvent(e)}>
                          <Users className="h-3 w-3 mr-1" /> Contestants
                        </Button>
                        {e.status === "draft" && (
                          <Button size="sm" variant="default" onClick={() => handleStatusChange(e, "live")}>
                            <Eye className="h-3 w-3 mr-1" /> Activate
                          </Button>
                        )}
                        {e.status === "live" && (
                          <Button size="sm" variant="secondary" onClick={() => handleStatusChange(e, "ended")}>
                            <EyeOff className="h-3 w-3 mr-1" /> End
                          </Button>
                        )}
                        {e.status === "ended" && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(e, "live")}>
                            Reopen
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(e)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
  );
};

export default EventManager;
