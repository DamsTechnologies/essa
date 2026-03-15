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
import { Plus, Trash2, Edit, Loader2, ImagePlus, Video, Star, X } from "lucide-react";
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

interface ContestantMedia {
  id: string;
  media_type: "image" | "video";
  url: string;
  is_primary: boolean;
  sort_order: number;
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

  // Media management
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [mediaContestant, setMediaContestant] = useState<EventContestant | null>(null);
  const [media, setMedia] = useState<ContestantMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);

  // Basic form fields
  const [formName, setFormName] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formDescription, setFormDescription] = useState("");
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

  const fetchMedia = async (contestantId: string) => {
    setMediaLoading(true);
    const { data } = await supabase
      .from("contestant_media")
      .select("*")
      .eq("contestant_id", contestantId)
      .order("sort_order", { ascending: true });
    if (data) setMedia(data as ContestantMedia[]);
    setMediaLoading(false);
  };

  const openMediaDialog = (c: EventContestant) => {
    setMediaContestant(c);
    setShowMediaDialog(true);
    fetchMedia(c.id);
  };

  const resetForm = () => {
    setFormName(""); setFormDepartment(""); setFormDescription("");
    setFormImage(null); setFormImageUrl("");
    setEditing(null); setShowDialog(false);
  };

  const openEdit = (c: EventContestant) => {
    setEditing(c);
    setFormName(c.name);
    setFormDepartment(c.department || "");
    setFormDescription(c.description || "");
    setFormImageUrl(c.profile_image || "");
    setShowDialog(true);
  };

  // ── Upload single profile image for new contestant ──────────────────────────
  const uploadSingleImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `event_contestant_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("contestant-images").upload(fileName, file);
    if (error) throw error;
    const { data: pub } = supabase.storage.from("contestant-images").getPublicUrl(fileName);
    return pub.publicUrl;
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      let imageUrl = formImageUrl;
      if (formImage) {
        if (formImage.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); setSaving(false); return; }
        imageUrl = await uploadSingleImage(formImage);
      }

      const payload: Record<string, any> = {
        name: formName.trim(),
        department: formDepartment.trim() || null,
        description: formDescription.trim() || null,
        video_url: null,
      };
      if (imageUrl) payload.profile_image = imageUrl;

      if (editing) {
        const { error } = await supabase.from("event_contestants").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Contestant updated");
      } else {
        payload.event_id = event.id;
        if (!imageUrl) { toast.error("Please upload a profile image"); setSaving(false); return; }
        payload.profile_image = imageUrl;
        const { data: newContestant, error } = await supabase
          .from("event_contestants")
          .insert([payload] as any)
          .select("id")
          .single();
        if (error) throw error;

        // Also save the first image to contestant_media as primary
        if (newContestant) {
          await supabase.from("contestant_media").insert({
            contestant_id: newContestant.id,
            media_type: "image",
            url: imageUrl,
            is_primary: true,
            sort_order: 0,
          });
        }
        toast.success("Contestant added! You can now add more photos and videos.");
      }

      resetForm();
      fetchContestants();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contestant and all their media?")) return;
    const { error } = await supabase.from("event_contestants").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchContestants(); }
  };

  // ── Multi-image upload ───────────────────────────────────────────────────────
  const handleMultiImageUpload = async (files: FileList) => {
    if (!mediaContestant) return;
    setUploadingImages(true);

    const currentCount = media.filter(m => m.media_type === "image").length;
    const hasPrimary = media.some(m => m.is_primary);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // No size limit for media gallery — only basic type check
        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
          toast.error(`${file.name} is not a supported image type`);
          continue;
        }

        const ext = file.name.split(".").pop();
        const fileName = `contestant_gallery_${mediaContestant.id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("contestant-images")
          .upload(fileName, file);
        if (uploadError) { toast.error(`Failed to upload ${file.name}`); continue; }

        const { data: pub } = supabase.storage.from("contestant-images").getPublicUrl(fileName);
        const isPrimary = !hasPrimary && i === 0;

        await supabase.from("contestant_media").insert({
          contestant_id: mediaContestant.id,
          media_type: "image",
          url: pub.publicUrl,
          is_primary: isPrimary,
          sort_order: currentCount + i,
        });

        // If this is the first/primary image, also update profile_image on contestant
        if (isPrimary) {
          await supabase.from("event_contestants")
            .update({ profile_image: pub.publicUrl })
            .eq("id", mediaContestant.id);
        }
      }

      toast.success(`${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
      fetchMedia(mediaContestant.id);
      fetchContestants();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    }
    setUploadingImages(false);
  };

  // ── Set primary image ────────────────────────────────────────────────────────
  const handleSetPrimary = async (mediaItem: ContestantMedia) => {
    if (!mediaContestant) return;
    // Clear all primary flags
    await supabase.from("contestant_media")
      .update({ is_primary: false })
      .eq("contestant_id", mediaContestant.id);
    // Set new primary
    await supabase.from("contestant_media")
      .update({ is_primary: true })
      .eq("id", mediaItem.id);
    // Update contestant profile_image
    await supabase.from("event_contestants")
      .update({ profile_image: mediaItem.url })
      .eq("id", mediaContestant.id);

    toast.success("Primary image updated");
    fetchMedia(mediaContestant.id);
    fetchContestants();
  };

  // ── Add video link ───────────────────────────────────────────────────────────
  const handleAddVideoLink = async () => {
    if (!mediaContestant || !videoLink.trim()) return;
    setAddingVideo(true);
    const sortOrder = media.length;
    const { error } = await supabase.from("contestant_media").insert({
      contestant_id: mediaContestant.id,
      media_type: "video",
      url: videoLink.trim(),
      is_primary: false,
      sort_order: sortOrder,
    });
    if (error) { toast.error("Failed to add video"); }
    else {
      // Also update the video_url on the contestant for backwards compat
      await supabase.from("event_contestants")
        .update({ video_url: videoLink.trim() })
        .eq("id", mediaContestant.id);
      toast.success("Video added");
      setVideoLink("");
      fetchMedia(mediaContestant.id);
    }
    setAddingVideo(false);
  };

  // ── Delete media item ────────────────────────────────────────────────────────
  const handleDeleteMedia = async (item: ContestantMedia) => {
    if (!confirm("Remove this media?")) return;
    const { error } = await supabase.from("contestant_media").delete().eq("id", item.id);
    if (error) { toast.error("Failed to remove"); return; }

    // If it was primary, set the next image as primary
    if (item.is_primary && mediaContestant) {
      const remaining = media.filter(m => m.id !== item.id && m.media_type === "image");
      if (remaining.length > 0) {
        await supabase.from("contestant_media").update({ is_primary: true }).eq("id", remaining[0].id);
        await supabase.from("event_contestants")
          .update({ profile_image: remaining[0].url })
          .eq("id", mediaContestant.id);
      } else {
        await supabase.from("event_contestants")
          .update({ profile_image: null })
          .eq("id", mediaContestant!.id);
      }
    }

    toast.success("Removed");
    fetchMedia(mediaContestant!.id);
    fetchContestants();
  };

  return (
    <>
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
                  <Label>Profile Image {!editing && "*"}</Label>
                  <Input type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setFormImage(e.target.files?.[0] || null)} />
                  {formImageUrl && !formImage && (
                    <img src={formImageUrl} alt="Profile" className="mt-2 h-16 rounded object-cover" />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    After saving, use "Media" to add more photos and videos
                  </p>
                </div>
                <div>
                  <Label>Description / Biography</Label>
                  <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                    maxLength={2000} rows={3} />
                </div>
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
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => openMediaDialog(c)}>
                            <ImagePlus className="h-3 w-3 mr-1" /> Media
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
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

      {/* ── Media Management Dialog ─────────────────────────────────────────── */}
      <Dialog open={showMediaDialog} onOpenChange={(open) => {
        if (!open) { setShowMediaDialog(false); setMediaContestant(null); setMedia([]); setVideoLink(""); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5" />
              Media — {mediaContestant?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload images */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Add Photos (select multiple at once)
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  id="multi-image-upload"
                  onChange={(e) => e.target.files && handleMultiImageUpload(e.target.files)}
                />
                <label htmlFor="multi-image-upload" className="cursor-pointer">
                  {uploadingImages ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" /> Uploading...
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Click to select photos</p>
                      <p className="text-xs mt-1">JPG, PNG, WebP, GIF — no size limit</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Add video link */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Add Video Link
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                YouTube, Google Drive, TikTok, or any video URL
              </p>
              <div className="flex gap-2">
                <Input
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1"
                />
                <Button onClick={handleAddVideoLink} disabled={addingVideo || !videoLink.trim()} size="sm">
                  {addingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4 mr-1" />}
                  Add
                </Button>
              </div>
            </div>

            {/* Current media grid */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Current Media ({media.length})
              </Label>
              {mediaLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : media.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No media yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {media.map((item) => (
                    <div key={item.id} className="relative group rounded-lg overflow-hidden border border-border">
                      {item.media_type === "image" ? (
                        <img
                          src={item.url}
                          alt="Media"
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted flex flex-col items-center justify-center gap-1 p-2">
                          <Video className="h-6 w-6 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground text-center truncate w-full">
                            {item.url.length > 30 ? item.url.slice(0, 30) + "..." : item.url}
                          </p>
                        </div>
                      )}

                      {/* Primary badge */}
                      {item.is_primary && (
                        <div className="absolute top-1 left-1 bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5" /> Main
                        </div>
                      )}

                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {item.media_type === "image" && !item.is_primary && (
                          <Button size="sm" variant="secondary" className="text-xs h-7 px-2"
                            onClick={() => handleSetPrimary(item)}>
                            <Star className="h-3 w-3 mr-1" /> Set Main
                          </Button>
                        )}
                        <Button size="icon" variant="destructive" className="h-7 w-7"
                          onClick={() => handleDeleteMedia(item)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventContestantManager;
