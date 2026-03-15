import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, ExternalLink, Filter, Star, Vote, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useSEO, SEOConfigs } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StaticEvent {
  id: number;
  title: string;
  date: string;
  time?: string;
  endDate?: string;
  venue: string;
  category: string;
  description: string;
  banner: string;
  registrationLink?: string;
  attendees: number;
  isPast: boolean;
  isStatic: true;
}

interface HubEvent {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  banner_image: string | null;
  voting_type: "monetary" | "free";
  status: "live" | "ended";
  start_date: string | null;
  end_date: string | null;
  isStatic: false;
}

type AnyEvent = StaticEvent | HubEvent;

// ─── Static Data ─────────────────────────────────────────────────────────────

const staticUpcoming: StaticEvent[] = [
  {
    id: 1,
    title: "ESSA Annual Cultural Week 2024",
    date: "2024-10-15",
    time: "09:00 AM",
    endDate: "2024-10-19",
    venue: "ESTAM Main Auditorium",
    category: "Cultural",
    description: "Five days of cultural celebrations featuring music, dance, drama, and art exhibitions from students across all faculties.",
    banner: "/placeholder.svg",
    registrationLink: "#",
    attendees: 850,
    isPast: false,
    isStatic: true,
  },
  {
    id: 2,
    title: "Inter-Faculty Sports Championship",
    date: "2024-10-22",
    time: "08:00 AM",
    endDate: "2024-10-24",
    venue: "ESTAM Sports Complex",
    category: "Sports",
    description: "Annual sports competition featuring football, basketball, volleyball, athletics, and more.",
    banner: "/placeholder.svg",
    registrationLink: "#",
    attendees: 450,
    isPast: false,
    isStatic: true,
  },
  {
    id: 3,
    title: "Academic Excellence Symposium",
    date: "2024-11-05",
    time: "10:00 AM",
    venue: "Faculty of Sciences Lecture Hall",
    category: "Academic",
    description: "Showcasing outstanding research projects and academic achievements by ESTAM students.",
    banner: "/placeholder.svg",
    registrationLink: "#",
    attendees: 200,
    isPast: false,
    isStatic: true,
  },
  {
    id: 4,
    title: "Leadership Workshop Series",
    date: "2024-11-12",
    time: "02:00 PM",
    venue: "Student Center Conference Room",
    category: "Workshop",
    description: "Professional development workshop focusing on leadership skills and career advancement.",
    banner: "/placeholder.svg",
    registrationLink: "#",
    attendees: 75,
    isPast: false,
    isStatic: true,
  },
  {
    id: 5,
    title: "ESSA Elections 2025",
    date: "2024-12-10",
    time: "08:00 AM",
    venue: "Multiple Voting Centers",
    category: "Elections",
    description: "Annual student elections for ESSA executive positions. Exercise your democratic right!",
    banner: "/placeholder.svg",
    registrationLink: "#",
    attendees: 1200,
    isPast: false,
    isStatic: true,
  },
];

const staticPast: StaticEvent[] = [
  {
    id: 6,
    title: "Welcome Week 2024",
    date: "2024-09-02",
    venue: "Campus Wide",
    category: "Orientation",
    description: "Orientation week for new students featuring campus tours, faculty introductions, and social activities.",
    banner: "/placeholder.svg",
    attendees: 600,
    isPast: true,
    isStatic: true,
  },
  {
    id: 7,
    title: "Mental Health Awareness Campaign",
    date: "2024-08-15",
    venue: "Student Welfare Center",
    category: "Welfare",
    description: "Educational campaign promoting mental health awareness and available support services.",
    banner: "/placeholder.svg",
    attendees: 320,
    isPast: true,
    isStatic: true,
  },
  {
    id: 8,
    title: "Career Fair 2024",
    date: "2024-07-20",
    venue: "Main Campus Hall",
    category: "Career",
    description: "Annual career fair connecting students with potential employers and internship opportunities.",
    banner: "/placeholder.svg",
    attendees: 750,
    isPast: true,
    isStatic: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

const HubEventCard = ({ event }: { event: HubEvent }) => (
  <Link to={`/events-hub/${event.id}`} className="block h-full">
    <Card className="group hover:shadow-card transition-all duration-300 overflow-hidden h-full border-accent/30">
      {/* Live badge ribbon */}
      {event.status === "live" && (
        <div className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
          LIVE NOW — Vote Open
        </div>
      )}
      {event.banner_image ? (
        <img
          src={event.banner_image}
          alt={event.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center">
          <Vote className="h-12 w-12 text-white/60" />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant={event.status === "live" ? "default" : "secondary"}>
            {event.status === "live" ? "Live Contest" : "Ended"}
          </Badge>
          <Badge variant="outline">
            {event.voting_type === "monetary" ? "💰 Paid Voting" : "🗳️ Free Voting"}
          </Badge>
          {event.category && <Badge variant="outline">{event.category}</Badge>}
        </div>

        <h3 className="text-xl font-bold text-primary mb-3">{event.title}</h3>

        {event.description && (
          <p className="text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
        )}

        {(event.start_date || event.end_date) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4 text-accent" />
            <span>
              {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBD"}
              {" — "}
              {event.end_date ? new Date(event.end_date).toLocaleDateString() : "TBD"}
            </span>
          </div>
        )}

        <Button className="w-full" variant={event.status === "live" ? "default" : "secondary"}>
          {event.status === "live" ? (
            <><Trophy className="h-4 w-4 mr-2" /> Vote Now</>
          ) : (
            <>View Results <ExternalLink className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </CardContent>
    </Card>
  </Link>
);

const StaticEventCard = ({ event, isPast }: { event: StaticEvent; isPast: boolean }) => (
  <Card className={`group hover:shadow-card transition-all duration-300 overflow-hidden h-full ${isPast ? "" : ""}`}>
    <div className="aspect-video overflow-hidden">
      <img
        src={event.banner}
        alt={event.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <CardContent className="p-6">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant={isPast ? "outline" : "default"}>{event.category}</Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {event.attendees} {isPast ? "attended" : "registered"}
        </div>
      </div>

      <h3 className={`font-bold text-primary mb-3 ${isPast ? "text-lg" : "text-xl"}`}>{event.title}</h3>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-accent" />
          <span>{formatDate(event.date)}</span>
          {!isPast && event.endDate && event.endDate !== event.date && (
            <span className="text-muted-foreground">— {formatDate(event.endDate)}</span>
          )}
        </div>
        {event.time && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-accent" />
            <span>{event.time}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-accent" />
          <span>{event.venue}</span>
        </div>
      </div>

      <p className="text-muted-foreground mb-4 text-sm">{event.description}</p>

      {!isPast && (
        <Button className="w-full">
          Register Now <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      )}
    </CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Events = () => {
  useSEO(SEOConfigs.events);
  const [activeFilter, setActiveFilter] = useState("All");
  const [hubEvents, setHubEvents] = useState<HubEvent[]>([]);
  const [hubLoading, setHubLoading] = useState(true);

  useEffect(() => {
    const fetchHubEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, description, category, banner_image, voting_type, status, start_date, end_date")
        .in("status", ["live", "ended"])
        .order("created_at", { ascending: false });
      if (data) setHubEvents(data.map((e) => ({ ...e, isStatic: false as const })));
      setHubLoading(false);
    };
    fetchHubEvents();
  }, []);

  // Merge: hub live events go first among upcoming, hub ended go with past
  const liveHubEvents = hubEvents.filter((e) => e.status === "live");
  const endedHubEvents = hubEvents.filter((e) => e.status === "ended");

  const allUpcoming: AnyEvent[] = [...liveHubEvents, ...staticUpcoming];
  const allPast: AnyEvent[] = [...endedHubEvents, ...staticPast];

  // Collect dynamic categories from hub events
  const hubCategories = hubEvents
    .map((e) => e.category)
    .filter((c): c is string => !!c && !["Cultural","Sports","Academic","Workshop","Elections","Orientation","Welfare","Career"].includes(c));
  const uniqueHubCats = [...new Set(hubCategories)];

  const categories = [
    "All", "Cultural", "Sports", "Academic", "Workshop",
    "Elections", "Orientation", "Welfare", "Career",
    ...uniqueHubCats,
    "Contest", // catch-all for hub events without a matching static category
  ];

  const matchesFilter = (event: AnyEvent) => {
    if (activeFilter === "All") return true;
    if (!event.isStatic) {
      // Hub events: match by category, or show under "Contest" if no category
      return event.category === activeFilter || (!event.category && activeFilter === "Contest");
    }
    return event.category === activeFilter;
  };

  const filteredUpcoming = allUpcoming.filter(matchesFilter);
  const filteredPast = allPast.filter(matchesFilter);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-hero py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ESSA <span className="text-accent">Events</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Celebrating student life through vibrant events, competitions, and meaningful experiences
            </p>
          </div>
        </div>
      </section>

      {/* Fashion Contest Banner */}
      <section className="py-8 bg-gradient-primary">
        <div className="container max-w-screen-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-primary-foreground">
            <div className="flex items-center gap-4">
              <div className="bg-accent/20 p-3 rounded-full">
                <Star className="h-8 w-8 text-accent" />
              </div>
              <div>
                <Badge className="bg-accent text-accent-foreground mb-2">🔥 Live Now</Badge>
                <h3 className="text-2xl font-heading font-bold">Fashion Magazine Cover Contest</h3>
                <p className="text-primary-foreground/80">
                  Mass Communication Students • Vote & Support Your Favorite Contestant
                </p>
              </div>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/competition">
                Vote Now <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 bg-muted/30">
        <div className="container max-w-screen-2xl">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Filter by category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={activeFilter === category ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setActiveFilter(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Upcoming & Active Events</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't miss out — vote in active contests and register for upcoming events
            </p>
          </div>

          {hubLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredUpcoming.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No upcoming events in this category.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredUpcoming.map((event) =>
                event.isStatic ? (
                  <StaticEventCard key={`static-${event.id}`} event={event} isPast={false} />
                ) : (
                  <HubEventCard key={`hub-${event.id}`} event={event} />
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Past Events</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Celebrating our successful events and the memories we've created together
            </p>
          </div>

          {filteredPast.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No past events in this category.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPast.map((event) =>
                event.isStatic ? (
                  <StaticEventCard key={`static-past-${event.id}`} event={event} isPast={true} />
                ) : (
                  <HubEventCard key={`hub-past-${event.id}`} event={event} />
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-primary">
        <div className="container max-w-screen-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">Have an Event Idea?</h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            ESSA is always looking for creative ways to enhance student life. Share your ideas with us!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">Submit Event Proposal</Button>
            <Button size="lg" variant="outline" className="btn-ghost-hero">Join Events Committee</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
