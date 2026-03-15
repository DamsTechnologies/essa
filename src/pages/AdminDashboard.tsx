import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users, DollarSign, Trophy, LogOut, Plus, Trash2, Edit,
  Loader2, Vote, Settings, Calendar, Shield,
} from "lucide-react";
import EventManager from "@/components/admin/EventManager";
import VoteMonitoringPanel from "@/components/admin/VoteMonitoringPanel"; // ← NEW
import { toast } from "sonner";

interface Contestant {
  id: string;
  name: string;
  design_title: string;
  cover_image: string;
  profile_image: string | null;
  total_votes: number;
  is_active: boolean;
  design_description: string | null;
  biography: string | null;
  slug: string | null;
}

interface Payment {
  id: string;
  email: string;
  voter_name: string | null;
  amount: number;
  votes_purchased: number;
  transaction_reference: string;
  payment_status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contestEnabled, setContestEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "contestants" | "payments" | "settings" | "events" | "monitoring"
  >("contestants");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesignTitle, setFormDesignTitle] = useState("");
  const [formCoverImage, setFormCoverImage] = useState<File | null>(null);
  const [formProfileImage, setFormProfileImage] = useState<File | null>(null);
  const [formCoverImageUrl, setFormCoverImageUrl] = useState("");
  const [formProfileImageUrl, setFormProfileImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBiography, setFormBiography] = useState("");
  const [saving, setSaving] = useState(false);

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
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    const [contestantsRes, paymentsRes, settingsRes] = await Promise.all([
      supabase.from("contestants").select("*").order("total_votes", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("contest_settings").select("*").limit(1).single(),
    ]);

    if (contestantsRes.data) setContestants(contestantsRes.data.map(d => ({
      id: d.id, name: d.name, design_title: d.design_title, cover_image: d.cover_image,
      profile_image: d.profile_image, total_votes: d.total_votes, is_active: d.is_active,
      design_description: d.design_description, biography: d.biography, slug: d.slug,
    })));
    if (paymentsRes.data) setPayments(paymentsRes.data as Payment[]);
    if (settingsRes.data) setContestEnabled(settingsRes.data.is_enabled);
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin"); };

  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const uploadImage = async (file: File, prefix: string) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 2MB.`);
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only JPEG, PNG, and WebP images are allowed.");
    }
    const ext = file.name.split(".").pop();
    const fileName = `${prefix}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("contestant-images").upload(fileName, file);
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from("contestant-images").getPublicUrl(fileName);
    return publicUrl.publicUrl;
  };

  const handleSaveContestant = async () => {
    if (!formName || !formDesignTitle) { toast.error("Name and design title are required"); return; }
    setSaving(true);
    try {
      let coverUrl = formCoverImageUrl;
      let profileUrl = formProfileImageUrl;
      if (formCoverImage) coverUrl = await uploadImage(formCoverImage, "cover");
      if (formProfileImage) profileUrl = await uploadImage(formProfileImage, "profile");
      if (!coverUrl && !editingContestant) { toast.error("Please upload a cover image"); setSaving(false); return; }

      if (editingContestant) {
        const updateData: Record<string, any> = {
          name: formName, design_title: formDesignTitle,
          design_description: formDescription || null, biography: formBiography || null,
        };
        if (coverUrl) updateData.cover_image = coverUrl;
        if (profileUrl) updateData.profile_image = profileUrl;
        const { error } = await supabase.from("contestants").update(updateData).eq("id", editingContestant.id);
        if (error) toast.error("Failed to update contestant");
        else toast.success("Contestant updated");
      } else {
        const { error } = await supabase.from("contestants").insert({
          name: formName, design_title: formDesignTitle, cover_image: coverUrl,
          profile_image: profileUrl || null,
          design_description: formDescription || null, biography: formBiography || null,
        });
        if (error) toast.error("Failed to add contestant");
        else toast.success("Contestant added");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    }
    resetForm();
    fetchData();
    setSaving(false);
  };

  const handleDeleteContestant = async (id: string) => {
    if (!confirm("Are you sure? This will delete all votes for this contestant.")) return;
    const { error } = await supabase.from("contestants").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Contestant deleted"); fetchData(); }
  };

  const handleToggleContest = async (enabled: boolean) => {
    const { error } = await supabase.from("contest_settings")
      .update({ is_enabled: enabled }).not("id", "is", null);
    if (error) toast.error("Failed to update");
    else { setContestEnabled(enabled); toast.success(enabled ? "Contest enabled" : "Contest disabled"); }
  };

  const resetForm = () => {
    setFormName(""); setFormDesignTitle(""); setFormCoverImage(null); setFormProfileImage(null);
    setFormCoverImageUrl(""); setFormProfileImageUrl(""); setFormDescription(""); setFormBiography("");
    setEditingContestant(null); setShowAddDialog(false);
  };

  const openEditDialog = (c: Contestant) => {
    setEditingContestant(c); setFormName(c.name); setFormDesignTitle(c.design_title);
    setFormCoverImageUrl(c.cover_image); setFormProfileImageUrl(c.profile_image || "");
    setFormDescription(c.design_description || ""); setFormBiography(c.biography || "");
    setShowAddDialog(true);
  };

  const totalFunds = payments
    .filter(p => p.payment_status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalVotes = contestants.reduce((sum, c) => sum + c.total_votes, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl">Contest Admin Panel</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}
          className="text-primary-foreground hover:text-primary-foreground/80">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>

      <div className="container max-w-screen-xl py-6 px-4">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card><CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 p-3 rounded-full"><Users className="h-6 w-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Contestants</p><p className="text-2xl font-bold">{contestants.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-6">
            <div className="bg-accent/10 p-3 rounded-full"><Vote className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Total Votes</p><p className="text-2xl font-bold">{totalVotes.toLocaleString()}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-6">
            <div className="bg-green-100 p-3 rounded-full"><DollarSign className="h-6 w-6 text-green-600" /></div>
            <div><p className="text-sm text-muted-foreground">Funds Raised</p><p className="text-2xl font-bold">₦{totalFunds.toLocaleString()}</p></div>
          </CardContent></Card>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            { key: "contestants" as const, icon: Users, label: "Contestants" },
            { key: "events" as const, icon: Calendar, label: "Events" },
            { key: "payments" as const, icon: DollarSign, label: "Payments" },
            { key: "monitoring" as const, icon: Shield, label: "Vote Monitoring" }, // ← NEW
            { key: "settings" as const, icon: Settings, label: "Settings" },
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

        {/* Contestants Tab */}
        {activeTab === "contestants" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Contestants</CardTitle>
              <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Contestant</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingContestant ? "Edit" : "Add"} Contestant</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={100} /></div>
                    <div><Label>Design Title</Label><Input value={formDesignTitle} onChange={(e) => setFormDesignTitle(e.target.value)} maxLength={100} placeholder="e.g. Ethereal Elegance" /></div>
                    <div>
                      <Label>Cover Image (Magazine Cover)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setFormCoverImage(e.target.files?.[0] || null)} />
                      {formCoverImageUrl && !formCoverImage && <img src={formCoverImageUrl} alt="Cover" className="mt-2 h-20 rounded object-cover" />}
                    </div>
                    <div>
                      <Label>Profile Picture (optional)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setFormProfileImage(e.target.files?.[0] || null)} />
                      {formProfileImageUrl && !formProfileImage && <img src={formProfileImageUrl} alt="Profile" className="mt-2 h-20 rounded-full object-cover" />}
                      <p className="text-xs text-muted-foreground mt-1">Falls back to cover image if not provided</p>
                    </div>
                    <div><Label>Design Inspiration / Description</Label><Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} maxLength={1000} placeholder="Describe the design concept..." rows={3} /></div>
                    <div><Label>Biography (optional)</Label><Textarea value={formBiography} onChange={(e) => setFormBiography(e.target.value)} maxLength={1000} placeholder="Short bio of the contestant..." rows={3} /></div>
                    <Button onClick={handleSaveContestant} disabled={saving} className="w-full">
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingContestant ? "Update" : "Add"} Contestant
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Design Title</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contestants.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell><img src={c.profile_image || c.cover_image} alt={c.name} className="w-12 h-12 rounded object-cover" /></TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.design_title}</TableCell>
                        <TableCell className="font-bold">{c.total_votes.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(c)}><Edit className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteContestant(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events Tab */}
        {activeTab === "events" && <EventManager />}

        {/* Vote Monitoring Tab — NEW */}
        {activeTab === "monitoring" && <VoteMonitoringPanel />}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <Card>
            <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Voter</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{p.voter_name || "—"}</TableCell>
                        <TableCell className="text-sm">{p.email}</TableCell>
                        <TableCell>₦{p.amount.toLocaleString()}</TableCell>
                        <TableCell>{p.votes_purchased}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.payment_status === "verified" ? "bg-green-100 text-green-700"
                            : p.payment_status === "failed" ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}>{p.payment_status}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {p.transaction_reference.slice(0, 20)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Card>
            <CardHeader><CardTitle>Contest Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Contest Voting</p>
                  <p className="text-sm text-muted-foreground">
                    {contestEnabled ? "Voting is currently open" : "Voting is currently closed"}
                  </p>
                </div>
                <Switch checked={contestEnabled} onCheckedChange={handleToggleContest} />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Current Leader</p>
                {contestants.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-accent" />
                    <span className="font-bold">{contestants[0].name}</span>
                    <span className="text-muted-foreground">— {contestants[0].total_votes.toLocaleString()} votes</span>
                  </div>
                ) : <p className="text-muted-foreground text-sm">No contestants yet</p>}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
