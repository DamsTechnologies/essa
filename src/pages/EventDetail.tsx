import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Trophy, ArrowLeft, Vote, LogOut, DollarSign } from "lucide-react";
import { toast } from "sonner";
import StudentAuthModal from "@/components/events/StudentAuthModal";
import EventVotingModal from "@/components/events/EventVotingModal";
import EventContestantCard from "@/components/events/EventContestantCard";
import VotingTransparencyWidget from "@/components/events/VotingTransparencyWidget";

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
  min_vote_amount: number;
  vote_conversion_rate: number;
  payment_currency: string;
  show_funds_raised: boolean; // ← per-event admin toggle
}

interface EventContestant {
  id: string;
  name: string;
  department: string | null;
  profile_image: string | null;
  cover_image: string | null; // ← magazine cover
  description: string | null;
  total_votes: number;
  slug: string | null;
}

const EventDetail = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [contestants, setContestants] = useState<EventContestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [votingContestant, setVotingContestant] = useState<EventContestant | null>(null);
  const [showMonetaryModal, setShowMonetaryModal] = useState(false);
  const [pendingVoteContestant, setPendingVoteContestant] = useState<EventContestant | null>(null);
  const [votedContestants, setVotedContestants] = useState<Set<string>>(new Set());
  const [votedInEvent, setVotedInEvent] = useState(false);

  const { student, login, signup, logout } = useStudentAuth();

  useSEO({
    title: event ? `${event.title} — ESSA` : "Event — ESSA",
    description: event?.description || "ESSA Event",
    url: `https://theessa.vercel.app/events-hub/${eventId}`,
  });

  // Handle payment success redirect
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Payment successful! Votes have been added.");
      window.history.replaceState({}, "", `/events-hub/${eventId}`);
    }
  }, [searchParams, eventId]);

  const fetchContestants = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase
      .from("event_contestants")
      .select("id, name, department, profile_image, cover_image, description, total_votes, slug")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .order("total_votes", { ascending: false });
    if (data) setContestants(data as EventContestant[]);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (eventData) setEvent(eventData as EventData);
      setLoading(false);
    };
    fetchEvent();
    fetchContestants();

    // Realtime updates
    const channel = supabase
      .channel(`event-contestants-${eventId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "event_contestants", filter: `event_id=eq.${eventId}` },
        (payload) => {
          setContestants((prev) =>
            prev
              .map((c) => c.id === payload.new.id ? { ...c, total_votes: (payload.new as any).total_votes } : c)
              .sort((a, b) => b.total_votes - a.total_votes)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_contestants", filter: `event_id=eq.${eventId}` },
        () => { fetchContestants(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetchContestants]);

  // Check which contestants the student already voted for
  useEffect(() => {
    if (!student || !eventId || !event || event.voting_type !== "free") return;
    const checkVotes = async () => {
      const { data } = await supabase
        .from("event_votes")
        .select("contestant_id")
        .eq("student_id", student.id)
        .eq("event_id", eventId);
      if (data) {
        setVotedContestants(new Set(data.map(v => v.contestant_id)));
        setVotedInEvent(data.length > 0);
      }
    };
    checkVotes();
  }, [student, eventId, event]);

  const handleVote = (contestant: EventContestant) => {
    if (!event || event.status !== "live") return;

    if (event.voting_type === "monetary") {
      setVotingContestant(contestant);
      setShowMonetaryModal(true);
      return;
    }

    if (!student) {
      setPendingVoteContestant(contestant);
      setShowAuthModal(true);
      return;
    }

    castFreeVote(contestant);
  };

  const castFreeVote = async (contestant: EventContestant) => {
    if (!student || !eventId) return;

    if (event?.vote_rule === "per_event" && votedInEvent) {
      toast.error("You have already voted in this event");
      return;
    }
    if (event?.vote_rule === "per_contestant" && votedContestants.has(contestant.id)) {
      toast.error("You have already voted for this contestant");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("event-free-vote", {
        body: { student_id: student.id, contestant_id: contestant.id, event_id: eventId },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Failed to cast vote");
        return;
      }

      toast.success(`Vote cast for ${contestant.name}!`);
      setVotedContestants(prev => new Set([...prev, contestant.id]));
      setVotedInEvent(true);
    } catch {
      toast.error("Something went wrong");
    }
  };

  // After login, cast the pending vote automatically
  useEffect(() => {
    if (student && pendingVoteContestant) {
      castFreeVote(pendingVoteContestant);
      setPendingVoteContestant(null);
    }
  }, [student, pendingVoteContestant]);

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
  const totalVotes = contestants.reduce((sum, c) => sum + c.total_votes, 0);

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
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant={isLive ? "default" : "secondary"}>{event.status}</Badge>
              <Badge variant="outline" className="text-white border-white/30">
                {event.voting_type === "monetary" ? "Paid Voting" : "Free Voting"}
              </Badge>
              {event.category && (
                <Badge variant="outline" className="text-white border-white/30">{event.category}</Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Student auth bar — free events only */}
      {event.voting_type === "free" && (
        <div className="border-b border-border bg-muted/50">
          <div className="container max-w-screen-xl px-4 py-3 flex items-center justify-between">
            {student ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-foreground">
                  Logged in as <span className="font-medium">{student.first_name} {student.last_name}</span>
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

      {/* Description & Stats */}
      <section className="py-6 border-b border-border">
        <div className="container max-w-screen-xl px-4">
          {event.description && (
            <p className="text-muted-foreground max-w-3xl mb-4">{event.description}</p>
          )}
          <div className="flex gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Vote className="h-4 w-4" /> {totalVotes.toLocaleString()} total votes
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-4 w-4" /> {contestants.length} contestants
            </div>
            {event.voting_type === "monetary" && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" /> ₦{event.vote_conversion_rate} per vote
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Transparency Widget — show_funds_raised controls funds display ── */}
      <section className="py-6 border-b border-border bg-muted/20">
        <div className="container max-w-screen-xl px-4">
          <VotingTransparencyWidget
            eventId={eventId!}
            votingType={event.voting_type}
            isLive={isLive}
            showFundsRaised={event.show_funds_raised}
          />
        </div>
      </section>

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
                    <div className={`text-2xl font-bold ${i === 0 ? "text-accent" : "text-muted-foreground"}`}>
                      #{i + 1}
                    </div>
                    {(c.cover_image || c.profile_image) ? (
                      <img
                        src={c.cover_image || c.profile_image!}
                        alt={c.name}
                        className="w-12 h-12 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        {c.name.charAt(0)}
                      </div>
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
                <EventContestantCard
                  key={c.id}
                  contestant={c}
                  eventId={eventId!}
                  isLive={isLive}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Auth Modal */}
      <StudentAuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingVoteContestant(null); }}
        onLogin={login}
        onSignup={signup}
      />

      {/* Monetary Voting Modal */}
      {event.voting_type === "monetary" && (
        <EventVotingModal
          contestant={votingContestant}
          event={{
            id: event.id,
            min_vote_amount: event.min_vote_amount,
            vote_conversion_rate: event.vote_conversion_rate,
            payment_currency: event.payment_currency,
          }}
          isOpen={showMonetaryModal}
          onClose={() => { setShowMonetaryModal(false); setVotingContestant(null); }}
        />
      )}

      <Footer />
    </div>
  );
};

export default EventDetail;
