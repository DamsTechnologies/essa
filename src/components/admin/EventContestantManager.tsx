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
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EventContestant {
  id: string;
  name: string;
  department: string | null;
  profile_image: string | null;
  video_url: string | null;
  description: string | null;
  total_votes: number;
  is_active: boolean;
  slug: string | null;
}

interface Props {
  event: { id: string; title: string; voting_type: string };
}

const EventContestantManager = ({ event }: Props) => {
  const [contestants, setContestants] = useState<EventContestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<EventContestant | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImageUrl, setFormImageUrl] = useState("");

  useEffect(() => { fetchContestants(); }, [event.id]);

  const fetchContestants = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("event_contestants")
      .select("*")
      .eq("event_id", event.id)
      .order("total_votes", { ascending: false });
    if (data) setContestants(data as EventContestant[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormName(""); setFormDepartment(""); setFormDescription("");
    setFormVideoUrl(""); setFormImage(null); setFormImageUrl("");
    setEditing(null); setShowDialog(false);
  };

  const openEdit = (c: EventContestant) => {
    setEditing(c); setFormName(c.name); setFormDepartment(c.department || "");
    setFormDescription(c.description || ""); setFormVideoUrl(c.video_url || "");
    setFormImageUrl(c.profile_image || ""); setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);

    try {
      let imageUrl = formImageUrl;
      if (formImage) {
        if (formImage.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); setSaving(false); return; }
        const ext = formImage.name.split(".").pop();
        const fileName = `event_contestant_${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("contestant-images").upload(fileName, formImage);
        if (error) throw error;
        const { data: pub } = supabase.storage.from("contestant-images").getPublicUrl(fileName);
        imageUrl = pub.publicUrl;
      }

      const payload: Record<string, any> = {
        name: formName.trim(),
        department: formDepartment.trim() || null,
        description: formDescription.trim() || null,
        video_url: formVideoUrl.trim() || null,
      };
      if (imageUrl) payload.profile_image = imageUrl;

      if (editing) {
        const { error } = await supabase.from("event_contestants").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Contestant updated");
      } else {
        payload.event_id = event.id;
        if (!imageUrl) { toast.error("Please upload an image"); setSaving(false); return; }
        payload.profile_image = imageUrl;
        const { error } = await supabase.from("event_contestants").insert(payload);
        if (error) throw error;
        toast.success("Contestant added");
      }

      resetForm();
      fetchContestants();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contestant?")) return;
    const { error } = await supabase.from("event_contestants").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchContestants(); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Contestants — {event.title}</CardTitle>
        <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowDialog(open); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Contestant</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Contestant</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={100} /></div>
              <div><Label>Department</Label><Input value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} maxLength={100} /></div>
              <div>
                <Label>Profile Image</Label>
                <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFormImage(e.target.files?.[0] || null)} />
                {formImageUrl && !formImage && <img src={formImageUrl} alt="Profile" className="mt-2 h-16 rounded object-cover" />}
              </div>
              <div><Label>Video URL (optional)</Label><Input value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} placeholder="https://youtube.com/..." /></div>
              <div><Label>Description / Biography</Label><Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} maxLength={2000} rows={3} /></div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? "Update" : "Add"} Contestant
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : contestants.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No contestants yet.</p>
        ) : (
          <div className="overflow-x-auto">
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
                      {c.profile_image ? (
                        <img src={c.profile_image} alt={c.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">N/A</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.department || "—"}</TableCell>
                    <TableCell className="font-bold">{c.total_votes.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default EventContestantManager;
