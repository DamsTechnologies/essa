import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Vote } from "lucide-react";

interface EventListing {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  banner_image: string | null;
  voting_type: "monetary" | "free";
  status: "draft" | "live" | "ended";
  start_date: string | null;
  end_date: string | null;
}

const EventsHub = () => {
  useSEO({
    title: "Events — ESSA Voting Platform",
    description: "Browse and participate in ESSA events. Vote for your favorites!",
    url: "https://theessa.vercel.app/events-hub",
  });

  const [events, setEvents] = useState<EventListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, description, category, banner_image, voting_type, status, start_date, end_date")
        .in("status", ["live", "ended"])
        .order("created_at", { ascending: false });
      if (data) setEvents(data as EventListing[]);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative bg-gradient-hero py-16 md:py-24">
        <div className="container max-w-screen-xl text-center text-white px-4">
          <h1 className="font-heading font-bold text-4xl md:text-6xl mb-4">
            ESSA <span className="text-accent">Events</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Browse active events and cast your votes
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-screen-xl px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><Skeleton className="h-48 w-full rounded-t-lg" /><CardContent className="p-4 space-y-2"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold text-primary mb-2">No Events Yet</h3>
              <p className="text-muted-foreground">Check back soon for upcoming events!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link key={event.id} to={`/events-hub/${event.id}`}>
                  <Card className="group overflow-hidden hover:shadow-card transition-all duration-300 h-full">
                    {event.banner_image ? (
                      <img
                        src={event.banner_image}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-hero flex items-center justify-center">
                        <Vote className="h-12 w-12 text-white/50" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={event.status === "live" ? "default" : "secondary"}>
                          {event.status === "live" ? "Live" : "Ended"}
                        </Badge>
                        <Badge variant="outline">
                          {event.voting_type === "monetary" ? "Paid Voting" : "Free Voting"}
                        </Badge>
                        {event.category && <Badge variant="outline">{event.category}</Badge>}
                      </div>
                      <h3 className="font-heading font-bold text-lg text-foreground mb-1">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      )}
                      {(event.start_date || event.end_date) && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBD"}
                          {" — "}
                          {event.end_date ? new Date(event.end_date).toLocaleDateString() : "TBD"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventsHub;
