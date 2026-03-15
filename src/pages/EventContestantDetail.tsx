import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ArrowLeft, Share2, Trophy, Play } from "lucide-react";
import { toast } from "sonner";

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

interface EventData {
  id: string;
  title: string;
  voting_type: "monetary" | "free";
  status: "draft" | "live" | "ended";
}

const EventContestantDetail = () => {
  const { eventId, contestantSlug } = useParams();
  const [contestant, setContestant] = useState<ContestantData | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: contestant ? `${contestant.name} — ESSA Events` : "Contestant — ESSA",
    description: contestant?.description || "ESSA Event Contestant",
    url: `https://theessa.vercel.app/events-hub/${eventId}/contestant/${contestantSlug}`,
  });

  useEffect(() => {
    if (!eventId || !contestantSlug) return;
    const fetch = async () => {
      const [eventRes, contestantRes] = await Promise.all([
        supabase.from("events").select("id, title, voting_type, status").eq("id", eventId).single(),
        supabase.from("event_contestants").select("*").eq("event_id", eventId)
          .or(`slug.eq.${contestantSlug},id.eq.${contestantSlug}`).single(),
      ]);
      if (eventRes.data) setEvent(eventRes.data as EventData);
      if (contestantRes.data) setContestant(contestantRes.data as ContestantData);
      setLoading(false);
    };
    fetch();

    // Realtime
    const channel = supabase
      .channel(`event-contestant-${contestantSlug}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "event_contestants" },
        (payload) => {
          if ((payload.new as any).slug === contestantSlug || (payload.new as any).id === contestantSlug) {
            setContestant((prev) => prev ? { ...prev, total_votes: (payload.new as any).total_votes } : prev);
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

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/);
    return match?.[1] || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-screen-lg py-12 px-4 space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-8 w-1/2" />
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

  const ytId = contestant.video_url ? getYouTubeId(contestant.video_url) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-screen-lg py-8 px-4">
        <Link to={`/events-hub/${eventId}`} className="text-primary hover:underline text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to {event.title}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Media section */}
          <div className="space-y-4">
            {contestant.profile_image && (
              <img
                src={contestant.profile_image}
                alt={contestant.name}
                className="w-full rounded-xl object-cover aspect-[3/4] shadow-card"
              />
            )}
            {ytId && (
              <div className="aspect-video rounded-xl overflow-hidden shadow-card">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  className="w-full h-full"
                  allowFullScreen
                  title={`${contestant.name} video`}
                />
              </div>
            )}
            {contestant.video_url && !ytId && (
              <a href={contestant.video_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm">
                <Play className="h-4 w-4" /> Watch Video
              </a>
            )}
          </div>

          {/* Info section */}
          <div className="space-y-6">
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground">{contestant.name}</h1>
              {contestant.department && (
                <p className="text-muted-foreground mt-1">{contestant.department}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-accent/10 rounded-xl px-6 py-4 text-center">
                <Trophy className="h-6 w-6 text-accent mx-auto mb-1" />
                <p className="text-3xl font-bold text-foreground">{contestant.total_votes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Votes</p>
              </div>
              <Badge variant={event.status === "live" ? "default" : "secondary"} className="text-sm">
                {event.status === "live" ? "Voting Open" : "Voting Closed"}
              </Badge>
            </div>

            {contestant.description && (
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">About</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{contestant.description}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 h-12">
                <Link to={`/events-hub/${eventId}`}>
                  <Heart className="h-5 w-5 mr-2" />
                  {event.status === "live" ? "Vote Now" : "View Results"}
                </Link>
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventContestantDetail;
