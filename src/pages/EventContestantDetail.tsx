import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart, ArrowLeft, Share2, Trophy, ChevronLeft, ChevronRight,
  Play, ExternalLink, CheckCircle, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import StudentAuthModal from "@/components/events/StudentAuthModal";
import EventVotingModal from "@/components/events/EventVotingModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContestantData {
  id: string;
  name: string;
  department: string | null;
  profile_image: string | null;
  cover_image: string | null;
  video_url: string | null;
  description: string | null;
  biography: string | null;
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
  vote_rule: "per_contestant" | "per_event";
  min_vote_amount: number;
  vote_conversion_rate: number;
  payment_currency: string;
  voting_paused: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getYouTubeId = (url: string) => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/
  );
  return match?.[1] || null;
};

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
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {activeIndex + 1} / {allMedia.length}
            </div>
          </>
        )}
      </div>

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
                <img src={item.url} alt={`Thumbnail ${i + 1}`} className="w-16 h-16 object-cover" />
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

  // ── Voting state ─────────────────────────────────────────────────────────
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMonetaryModal, setShowMonetaryModal] = useState(false);
  const [pendingVote, setPendingVote] = useState(false);
  const [votedForThisContestant, setVotedForThisContestant] = useState(false);
  const [votedInEvent, setVotedInEvent] = useState(false);
  const [castingVote, setCastingVote] = useState(false);

  const { student, login, signup, logout } = useStudentAuth();

  useSEO({
    title: contestant ? `${contestant.name} — ESSA Events` : "Contestant — ESSA",
    description: contestant?.description || "ESSA Event Contestant",
    url: `https://theessa.vercel.app/events-hub/${eventId}/contestant/${contestantSlug}`,
  });

  // ── Fetch all data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!eventId || !contestantSlug) return;

    const fetchAll = async () => {
      // Fetch event with full voting config
      const { data: eventData } = await supabase
        .from("events")
        .select("id, title, voting_type, status, vote_rule, min_vote_amount, vote_conversion_rate, payment_currency, voting_paused")
        .eq("id", eventId)
        .single();

      if (eventData) setEvent(eventData as EventData);

      // Fetch contestant by slug, fallback to id
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

        // Fetch media from contestant_media table
        const { data: mediaData } = await supabase
          .from("contestant_media")
          .select("*")
          .eq("contestant_id", contestantData.id)
          .order("sort_order", { ascending: true });

        if (mediaData && mediaData.length > 0) {
          setMedia(mediaData as MediaItem[]);
        } else {
          // Fallback: build from cover_image + profile_image + video_url fields
          const fallback: MediaItem[] = [];
          // Cover image is the primary display (magazine cover goes first)
          if (contestantData.cover_image) {
            fallback.push({
              id: "fallback-cover",
              media_type: "image",
              url: contestantData.cover_image,
              is_primary: true,
              sort_order: 0,
            });
          }
          // Profile image as secondary if different from cover
          if (contestantData.profile_image && contestantData.profile_image !== contestantData.cover_image) {
            fallback.push({
              id: "fallback-profile",
              media_type: "image",
              url: contestantData.profile_image,
              is_primary: !contestantData.cover_image,
              sort_order: 1,
            });
          }
          // If no cover_image, use profile_image as primary
          if (!contestantData.cover_image && contestantData.profile_image) {
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
              sort_order: fallback.length,
            });
          }
          setMedia(fallback);
        }
      }

      setLoading(false);
    };

    fetchAll();

    // Realtime vote count
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

  // ── Check if student already voted ───────────────────────────────────────
  useEffect(() => {
    if (!student || !eventId || !contestant || event?.voting_type !== "free") return;

    const checkVotes = async () => {
      // Check if voted for this specific contestant
      const { data: thisVote } = await supabase
        .from("event_votes")
        .select("id")
        .eq("student_id", student.id)
        .eq("contestant_id", contestant.id)
        .eq("event_id", eventId)
        .limit(1);
      if (thisVote && thisVote.length > 0) setVotedForThisContestant(true);

      // Check if voted anywhere in this event
      const { data: anyVote } = await supabase
        .from("event_votes")
        .select("id")
        .eq("student_id", student.id)
        .eq("event_id", eventId)
        .limit(1);
      if (anyVote && anyVote.length > 0) setVotedInEvent(true);
    };
    checkVotes();
  }, [student, eventId, contestant, event]);

  // ── Voting handlers ───────────────────────────────────────────────────────
  const handleVote = () => {
    if (!event || !contestant) return;
    if (event.status !== "live") { toast.error("Voting is not open for this event"); return; }
    if (event.voting_paused) { toast.error("Voting has been temporarily paused"); return; }

    if (event.voting_type === "monetary") {
      setShowMonetaryModal(true);
      return;
    }

    // Free voting
    if (!student) {
      setPendingVote(true);
      setShowAuthModal(true);
      return;
    }

    castFreeVote();
  };

  const castFreeVote = async () => {
    if (!student || !eventId || !contestant) return;

    if (event?.vote_rule === "per_event" && votedInEvent) {
      toast.error("You have already voted in this event");
      return;
    }
    if (event?.vote_rule === "per_contestant" && votedForThisContestant) {
      toast.error("You have already voted for this contestant");
      return;
    }

    setCastingVote(true);
    try {
      const { data, error } = await supabase.functions.invoke("event-free-vote", {
        body: { student_id: student.id, contestant_id: contestant.id, event_id: eventId },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Failed to cast vote");
        return;
      }

      toast.success(`Vote cast for ${contestant.name}! 🎉`);
      setVotedForThisContestant(true);
      setVotedInEvent(true);
    } catch {
      toast.error("Something went wrong");
    }
    setCastingVote(false);
  };

  // After login, cast the pending vote automatically
  useEffect(() => {
    if (student && pendingVote) {
      castFreeVote();
      setPendingVote(false);
    }
  }, [student, pendingVote]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Vote for ${contestant?.name}`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const isLive = event?.status === "live";
  const alreadyVoted =
    votedForThisContestant ||
    (event?.vote_rule === "per_event" && votedInEvent);

  const voteButtonLabel = () => {
    if (!isLive) return "Voting Closed";
    if (alreadyVoted) return "Already Voted ✓";
    if (castingVote) return "Casting Vote...";
    return `Vote for ${contestant?.name.split(" ")[0]}`;
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Student auth bar — free events only */}
      {event.voting_type === "free" && isLive && (
        <div className="border-b border-border bg-muted/50">
          <div className="container max-w-screen-lg px-4 py-2 flex items-center justify-between">
            {student ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-foreground">
                  Voting as <span className="font-medium">{student.first_name} {student.last_name}</span>
                </p>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-3 w-3 mr-1" /> Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Sign in to vote</p>
                <Button size="sm" onClick={() => setShowAuthModal(true)}>Sign In / Register</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container max-w-screen-lg py-8 px-4">

        {/* Back link */}
        <Link
          to={`/events-hub/${eventId}`}
          className="text-primary hover:underline text-sm flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {event.title}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

          {/* ── Left: Media Slideshow ────────────────────────────────────────── */}
          <div>
            <MediaSlideshow media={media} name={contestant.name} />
          </div>

          {/* ── Right: Info + Voting ─────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isLive ? "default" : "secondary"}>
                {isLive ? "Voting Open" : event.status === "ended" ? "Voting Closed" : "Draft"}
              </Badge>
              {event.voting_type === "monetary" && (
                <Badge variant="outline">💰 Paid Voting</Badge>
              )}
              {alreadyVoted && isLive && (
                <Badge variant="outline" className="text-green-600 border-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" /> Voted
                </Badge>
              )}
            </div>

            {/* Name */}
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground">
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

            {/* Description / Biography */}
            {contestant.description && (
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">About</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {contestant.description}
                </p>
              </div>
            )}
            {contestant.biography && contestant.biography !== contestant.description && (
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">Biography</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {contestant.biography}
                </p>
              </div>
            )}

            {/* ── VOTE BUTTON (works directly from this page) ──────────────── */}
            <div className="flex gap-3 pt-2">
              {isLive ? (
                <Button
                  className={`flex-1 h-12 text-base ${
                    alreadyVoted
                      ? "bg-green-600 hover:bg-green-600 text-white"
                      : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}
                  onClick={handleVote}
                  disabled={alreadyVoted || castingVote}
                >
                  {alreadyVoted
                    ? <><CheckCircle className="h-5 w-5 mr-2" /> Already Voted</>
                    : <><Heart className="h-5 w-5 mr-2" /> {voteButtonLabel()}</>
                  }
                </Button>
              ) : (
                <Button variant="secondary" className="flex-1 h-12 text-base" asChild>
                  <Link to={`/events-hub/${eventId}`}>
                    <Trophy className="h-5 w-5 mr-2" /> View Results
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

            {/* Media hint */}
            {media.length > 1 && (
              <p className="text-xs text-muted-foreground text-center">
                📸 {media.filter(m => m.media_type === "image").length} photos
                {media.filter(m => m.media_type === "video").length > 0 &&
                  ` · 🎬 ${media.filter(m => m.media_type === "video").length} video${
                    media.filter(m => m.media_type === "video").length > 1 ? "s" : ""
                  }`
                }
                {" "}— use arrows to browse
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Auth Modal ────────────────────────────────────────────────────────── */}
      <StudentAuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingVote(false); }}
        onLogin={login}
        onSignup={signup}
      />

      {/* ── Monetary Voting Modal ─────────────────────────────────────────────── */}
      {event.voting_type === "monetary" && (
        <EventVotingModal
          contestant={contestant}
          event={{
            id: event.id,
            min_vote_amount: event.min_vote_amount,
            vote_conversion_rate: event.vote_conversion_rate,
            payment_currency: event.payment_currency,
          }}
          isOpen={showMonetaryModal}
          onClose={() => setShowMonetaryModal(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default EventContestantDetail;
