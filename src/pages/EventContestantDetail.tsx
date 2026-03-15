import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart, ArrowLeft, Share2, Trophy, ChevronLeft, ChevronRight,
  Play, ExternalLink, Vote,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContestantData {
  id: string;
  name: string;
  department: string | null;
  profile_image: string | null;
  video_url: string | null;
  description: string | null;
  total_votes: number;
  slug: string | null;
  event_id: string;
}

interface MediaItem {
  id: string;
  media_type: "image" | "video";
  url: string;
  is_primary: boolean;
  sort_order: number;
}

interface EventData {
  id: string;
  title: string;
  voting_type: "monetary" | "free";
  status: "draft" | "live" | "ended";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getYouTubeId = (url: string) => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/
  );
  return match?.[1] || null;
};

const isVideoUrl = (url: string) =>
  url.includes("youtube") || url.includes("youtu.be") ||
  url.includes("vimeo") || url.includes("tiktok") ||
  url.includes("drive.google") || url.match(/\.(mp4|webm|mov)$/i);

// ─── Media Slideshow ──────────────────────────────────────────────────────────

const MediaSlideshow = ({ media, name }: { media: MediaItem[]; name: string }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = media.filter(m => m.media_type === "image");
  const videos = media.filter(m => m.media_type === "video");
  const allMedia = [...images, ...videos];

  const prev = () => setActiveIndex(i => (i - 1 + allMedia.length) % allMedia.length);
  const next = useCallback(() => setActiveIndex(i => (i + 1) % allMedia.length), [allMedia.length]);

  if (allMedia.length === 0) return null;

  const current = allMedia[activeIndex];
  const ytId = current.media_type === "video" ? getYouTubeId(current.url) : null;

  return (
    <div className="space-y-3">
      {/* Main media display */}
      <div className="relative rounded-2xl overflow-hidden bg-muted shadow-lg">
        {current.media_type === "image" ? (
          <img
            src={current.url}
            alt={`${name} — photo ${activeIndex + 1}`}
            className="w-full object-cover max-h-[520px]"
            style={{ aspectRatio: images.length === 1 ? "3/4" : "auto" }}
          />
        ) : ytId ? (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              className="w-full h-full"
              allowFullScreen
              title={`${name} video`}
            />
          </div>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-muted">
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
            >
              <Play className="h-16 w-16" />
              <span className="text-sm font-medium flex items-center gap-1">
                Watch Video <ExternalLink className="h-4 w-4" />
              </span>
            </a>
          </div>
        )}

        {/* Nav arrows — only show if more than 1 */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* Counter */}
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {activeIndex + 1} / {allMedia.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip — only show if more than 1 */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allMedia.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIndex
                  ? "border-accent scale-105"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {item.media_type === "image" ? (
                <img
                  src={item.url}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-16 h-16 object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-muted flex items-center justify-center">
                  <Play className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const EventContestantDetail = () => {
  const { eventId, contestantSlug } = useParams();
  const [contestant, setContestant] = useState<ContestantData | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: contestant ? `${contestant.name} — ESSA Events` : "Contestant — ESSA",
    description: contestant?.description || "ESSA Event Contestant",
    url: `https://theessa.vercel.app/events-hub/${eventId}/contestant/${contestantSlug}`,
  });

  useEffect(() => {
    if (!eventId || !contestantSlug) return;

    const fetchAll = async () => {
      // ── Fetch event ──────────────────────────────────────────────────────
      const { data: eventData } = await supabase
        .from("events")
        .select("id, title, voting_type, status")
        .eq("id", eventId)
        .single();

      if (eventData) setEvent(eventData as EventData);

      // ── Fetch contestant: try by slug first, then fall back to id ────────
      let contestantData: ContestantData | null = null;

      const { data: bySlug } = await supabase
        .from("event_contestants")
        .select("*")
        .eq("event_id", eventId)
        .eq("slug", contestantSlug)
        .maybeSingle();

      if (bySlug) {
        contestantData = bySlug as ContestantData;
      } else {
        // fallback: maybe the URL param is actually the UUID
        const { data: byId } = await supabase
          .from("event_contestants")
          .select("*")
          .eq("event_id", eventId)
          .eq("id", contestantSlug)
          .maybeSingle();

        if (byId) contestantData = byId as ContestantData;
      }

      if (contestantData) {
        setContestant(contestantData);

        // ── Fetch media ────────────────────────────────────────────────────
        const { data: mediaData } = await supabase
          .from("contestant_media")
          .select("*")
          .eq("contestant_id", contestantData.id)
          .order("sort_order", { ascending: true });

        if (mediaData && mediaData.length > 0) {
          setMedia(mediaData as MediaItem[]);
        } else {
          // Fallback: build media from profile_image + video_url fields
          const fallback: MediaItem[] = [];
          if (contestantData.profile_image) {
            fallback.push({
              id: "fallback-img",
              media_type: "image",
              url: contestantData.profile_image,
              is_primary: true,
              sort_order: 0,
            });
          }
          if (contestantData.video_url) {
            fallback.push({
              id: "fallback-vid",
              media_type: "video",
              url: contestantData.video_url,
              is_primary: false,
              sort_order: 1,
            });
          }
          setMedia(fallback);
        }
      }

      setLoading(false);
    };

    fetchAll();

    // ── Realtime vote count updates ──────────────────────────────────────
    const channel = supabase
      .channel(`event-contestant-${contestantSlug}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "event_contestants" },
        (payload) => {
          if (
            (payload.new as any).slug === contestantSlug ||
            (payload.new as any).id === contestantSlug
          ) {
            setContestant(prev =>
              prev ? { ...prev, total_votes: (payload.new as any).total_votes } : prev
            );
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, contestantSlug]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Vote for ${contestant?.name}`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-screen-lg py-12 px-4 space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!contestant || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-screen-lg py-20 px-4 text-center">
          <h2 className="text-2xl font-heading font-bold text-primary mb-4">Contestant Not Found</h2>
          <Button asChild><Link to={`/events-hub/${eventId}`}>← Back to Event</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isLive = event.status === "live";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-screen-lg py-8 px-4">

        {/* Back link */}
        <Link
          to={`/events-hub/${eventId}`}
          className="text-primary hover:underline text-sm flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {event.title}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

          {/* ── Left: Media ─────────────────────────────────────────────────── */}
          <div>
            <MediaSlideshow media={media} name={contestant.name} />
          </div>

          {/* ── Right: Info ─────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Name + department */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={isLive ? "default" : "secondary"}>
                  {isLive ? "Voting Open" : event.status === "ended" ? "Voting Closed" : "Draft"}
                </Badge>
                {event.voting_type === "monetary" && (
                  <Badge variant="outline">💰 Paid Voting</Badge>
                )}
              </div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mt-2">
                {contestant.name}
              </h1>
              {contestant.department && (
                <p className="text-muted-foreground mt-1 text-base">{contestant.department}</p>
              )}
            </div>

            {/* Vote count */}
            <div className="bg-accent/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="bg-accent/20 p-3 rounded-xl">
                <Trophy className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {contestant.total_votes.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Votes</p>
              </div>
            </div>

            {/* Description */}
            {contestant.description && (
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">About</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {contestant.description}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              {isLive ? (
                <Button
                  asChild
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base"
                >
                  <Link to={`/events-hub/${eventId}`}>
                    <Vote className="h-5 w-5 mr-2" />
                    Vote for {contestant.name.split(" ")[0]}
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="secondary"
                  className="flex-1 h-12 text-base"
                >
                  <Link to={`/events-hub/${eventId}`}>
                    <Trophy className="h-5 w-5 mr-2" />
                    View Results
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={handleShare}
                title="Share profile"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Media count hint */}
            {media.length > 1 && (
              <p className="text-xs text-muted-foreground text-center">
                📸 {media.filter(m => m.media_type === "image").length} photos
                {media.filter(m => m.media_type === "video").length > 0 &&
                  ` · 🎬 ${media.filter(m => m.media_type === "video").length} video${media.filter(m => m.media_type === "video").length > 1 ? "s" : ""}`
                }
                {" "}— swipe or use arrows to browse
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventContestantDetail;
