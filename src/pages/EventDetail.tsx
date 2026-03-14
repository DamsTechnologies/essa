import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Trophy, ArrowLeft, Vote } from "lucide-react";
import { toast } from "sonner";

interface EventData {
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
}

interface EventContestant {
  id: string;
  name: string;
  department: string | null;
  profile_image: string | null;
  description: string | null;
  total_votes: number;
  slug: string | null;
}

const EventDetail = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [contestants, setContestants] = useState<EventContestant[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: event ? `${event.title} — ESSA` : "Event — ESSA",
    description: event?.description || "ESSA Event",
    url: `https://theessa.vercel.app/events-hub/${eventId}`,
  });

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      const [eventRes, contestantsRes] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId).single(),
        supabase.from("event_contestants").select("*").eq("event_id", eventId).eq("is_active", true).order("total_votes", { ascending: false }),
      ]);
      if (eventRes.data) setEvent(eventRes.data as EventData);
      if (contestantsRes.data) setContestants(contestantsRes.data as EventContestant[]);
      setLoading(false);
    };
    fetchEvent();

    // Realtime updates for contestants
    const channel = supabase
      .channel(`event-contestants-${eventId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "event_contestants", filter: `event_id=eq.${eventId}` },
        (payload) => {
          setContestants((prev) => prev.map((c) => c.id === payload.new.id ? { ...c, total_votes: (payload.new as any).total_votes } : c));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const handleFreeVote = async (contestant: EventContestant) => {
    // Phase 2: This will require student authentication
    toast.info("Student login required for free voting. Coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-screen-xl py-12 px-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-screen-xl py-20 px-4 text-center">
          <h2 className="text-2xl font-heading font-bold text-primary mb-4">Event Not Found</h2>
          <Button asChild><Link to="/events-hub">← Browse Events</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const topContestants = [...contestants].sort((a, b) => b.total_votes - a.total_votes).slice(0, 3);
  const isLive = event.status === "live";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Banner */}
      <section className="relative">
        {event.banner_image ? (
          <img src={event.banner_image} alt={event.title} className="w-full h-48 md:h-72 object-cover" />
        ) : (
          <div className="w-full h-48 md:h-72 bg-gradient-hero flex items-center justify-center">
            <Vote className="h-16 w-16 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-end">
          <div className="container max-w-screen-xl px-4 pb-6">
            <Link to="/events-hub" className="text-white/70 hover:text-white text-sm flex items-center gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" /> All Events
            </Link>
            <h1 className="font-heading font-bold text-3xl md:text-5xl text-white">{event.title}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant={isLive ? "default" : "secondary"}>{event.status}</Badge>
              <Badge variant="outline" className="text-white border-white/30">
                {event.voting_type === "monetary" ? "Paid Voting" : "Free Voting"}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      {event.description && (
        <section className="py-6 border-b border-border">
          <div className="container max-w-screen-xl px-4">
            <p className="text-muted-foreground max-w-3xl">{event.description}</p>
          </div>
        </section>
      )}

      {/* Leaderboard */}
      {topContestants.length > 0 && (
        <section className="py-8">
          <div className="container max-w-screen-xl px-4">
            <h2 className="text-2xl font-heading font-bold text-primary mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-accent" /> Leaderboard
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topContestants.map((c, i) => (
                <Card key={c.id} className={`overflow-hidden ${i === 0 ? "ring-2 ring-accent" : ""}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`text-2xl font-bold ${i === 0 ? "text-accent" : "text-muted-foreground"}`}>#{i + 1}</div>
                    {c.profile_image ? (
                      <img src={c.profile_image} alt={c.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{c.name.charAt(0)}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.total_votes.toLocaleString()} votes</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contestants Grid */}
      <section className="py-8">
        <div className="container max-w-screen-xl px-4">
          <h2 className="text-2xl font-heading font-bold text-primary mb-6">All Contestants</h2>
          {contestants.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No contestants added yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {contestants.map((c) => (
                <Card key={c.id} className="group overflow-hidden hover:shadow-card transition-all duration-300">
                  <div className="relative">
                    {c.profile_image ? (
                      <img src={c.profile_image} alt={c.name} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                        <span className="text-4xl font-bold text-muted-foreground/30">{c.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground rounded-full px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
                      {c.total_votes.toLocaleString()} votes
                    </div>
                  </div>
                  <CardContent className="p-3 md:p-4">
                    <h3 className="font-heading font-bold text-sm md:text-lg text-foreground truncate">{c.name}</h3>
                    {c.department && <p className="text-xs text-muted-foreground truncate">{c.department}</p>}
                    <Button
                      className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90 text-sm h-9 md:h-10"
                      onClick={() => handleFreeVote(c)}
                      disabled={!isLive}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      {isLive ? "Vote" : "Ended"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventDetail;
