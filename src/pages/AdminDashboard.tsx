import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  DollarSign,
  Trophy,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Vote,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Contestant {
  id: string;
  name: string;
  department: string;
  cover_image: string;
  total_votes: number;
  is_active: boolean;
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
  const [activeTab, setActiveTab] = useState<"contestants" | "payments" | "settings">("contestants");

  // Add/Edit contestant
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      navigate("/admin");
      return;
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

    if (contestantsRes.data) setContestants(contestantsRes.data as Contestant[]);
    if (paymentsRes.data) setPayments(paymentsRes.data as Payment[]);
    if (settingsRes.data) setContestEnabled(settingsRes.data.is_enabled);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const handleSaveContestant = async () => {
    if (!formName || !formDept) {
      toast.error("Name and department are required");
      return;
    }

    setSaving(true);
    let imageUrl = formImageUrl;

    // Upload image if provided
    if (formImage) {
      const ext = formImage.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("contestant-images")
        .upload(fileName, formImage);

      if (uploadError) {
        toast.error("Failed to upload image");
        setSaving(false);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("contestant-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrl.publicUrl;
    }

    if (!imageUrl && !editingContestant) {
      toast.error("Please upload an image");
      setSaving(false);
      return;
    }

    if (editingContestant) {
      const updateData: any = { name: formName, department: formDept };
      if (imageUrl) updateData.cover_image = imageUrl;

      const { error } = await supabase
        .from("contestants")
        .update(updateData)
        .eq("id", editingContestant.id);

      if (error) toast.error("Failed to update contestant");
      else toast.success("Contestant updated");
    } else {
      const { error } = await supabase.from("contestants").insert({
        name: formName,
        department: formDept,
        cover_image: imageUrl,
      });

      if (error) toast.error("Failed to add contestant");
      else toast.success("Contestant added");
    }

    resetForm();
    fetchData();
    setSaving(false);
  };

  const handleDeleteContestant = async (id: string) => {
    if (!confirm("Are you sure? This will delete all votes for this contestant.")) return;

    const { error } = await supabase.from("contestants").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Contestant deleted");
      fetchData();
    }
  };

  const handleToggleContest = async (enabled: boolean) => {
    const { error } = await supabase
      .from("contest_settings")
      .update({ is_enabled: enabled })
      .not("id", "is", null);

    if (error) toast.error("Failed to update");
    else {
      setContestEnabled(enabled);
      toast.success(enabled ? "Contest enabled" : "Contest disabled");
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDept("");
    setFormImage(null);
    setFormImageUrl("");
    setEditingContestant(null);
    setShowAddDialog(false);
  };

  const openEditDialog = (c: Contestant) => {
    setEditingContestant(c);
    setFormName(c.name);
    setFormDept(c.department);
    setFormImageUrl(c.cover_image);
    setShowAddDialog(true);
  };

  const totalFunds = payments
    .filter((p) => p.payment_status === "verified")
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
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl">Contest Admin Panel</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:text-primary-foreground/80">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>

      <div className="container max-w-screen-xl py-6 px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contestants</p>
                <p className="text-2xl font-bold">{contestants.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-accent/10 p-3 rounded-full">
                <Vote className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold">{totalVotes.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funds Raised</p>
                <p className="text-2xl font-bold">₦{totalFunds.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "contestants" as const, icon: Users, label: "Contestants" },
            { key: "payments" as const, icon: DollarSign, label: "Payments" },
            { key: "settings" as const, icon: Settings, label: "Settings" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              onClick={() => setActiveTab(tab.key)}
              size="sm"
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingContestant ? "Edit" : "Add"} Contestant</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={100} />
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Input value={formDept} onChange={(e) => setFormDept(e.target.value)} maxLength={100} />
                    </div>
                    <div>
                      <Label>Cover Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormImage(e.target.files?.[0] || null)}
                      />
                      {formImageUrl && !formImage && (
                        <img src={formImageUrl} alt="Current" className="mt-2 h-20 rounded object-cover" />
                      )}
                    </div>
                    <Button onClick={handleSaveContestant} disabled={saving} className="w-full">
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {editingContestant ? "Update" : "Add"} Contestant
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contestants.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <img src={c.cover_image} alt={c.name} className="w-12 h-12 rounded object-cover" />
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.department}</TableCell>
                      <TableCell className="font-bold">{c.total_votes.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteContestant(c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
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
                        <TableCell className="text-sm">
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{p.voter_name || "—"}</TableCell>
                        <TableCell className="text-sm">{p.email}</TableCell>
                        <TableCell>₦{p.amount.toLocaleString()}</TableCell>
                        <TableCell>{p.votes_purchased}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              p.payment_status === "verified"
                                ? "bg-green-100 text-green-700"
                                : p.payment_status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {p.payment_status}
                          </span>
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
            <CardHeader>
              <CardTitle>Contest Settings</CardTitle>
            </CardHeader>
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
                <p className="font-medium mb-2">Winner</p>
                {contestants.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-accent" />
                    <span className="font-bold">{contestants[0].name}</span>
                    <span className="text-muted-foreground">
                      — {contestants[0].total_votes.toLocaleString()} votes
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No contestants yet</p>
                )}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Paystack Webhook URL</p>
                <code className="text-xs bg-background p-2 rounded block break-all">
                  {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/paystack-webhook`}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Add this URL in your Paystack Dashboard → Settings → API Keys & Webhooks → Webhook URL
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
