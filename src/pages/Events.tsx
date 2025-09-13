import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, ExternalLink, Filter } from "lucide-react";
import { useState } from "react";
import { useSEO, SEOConfigs } from "@/hooks/useSEO";

const Events = () => {
  useSEO(SEOConfigs.events);
  const [activeFilter, setActiveFilter] = useState("All");

  const upcomingEvents = [
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
      attendees: 850
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
      attendees: 450
    },
    {
      id: 3,
      title: "Academic Excellence Symposium",
      date: "2024-11-05",
      time: "10:00 AM",
      endDate: "2024-11-05",
      venue: "Faculty of Sciences Lecture Hall",
      category: "Academic",
      description: "Showcasing outstanding research projects and academic achievements by ESTAM students.",
      banner: "/placeholder.svg",
      registrationLink: "#",
      attendees: 200
    },
    {
      id: 4,
      title: "Leadership Workshop Series",
      date: "2024-11-12",
      time: "02:00 PM",
      endDate: "2024-11-12",
      venue: "Student Center Conference Room",
      category: "Workshop",
      description: "Professional development workshop focusing on leadership skills and career advancement.",
      banner: "/placeholder.svg",
      registrationLink: "#",
      attendees: 75
    },
    {
      id: 5,
      title: "ESSA Elections 2025",
      date: "2024-12-10",
      time: "08:00 AM",
      endDate: "2024-12-10",
      venue: "Multiple Voting Centers",
      category: "Elections",
      description: "Annual student elections for ESSA executive positions. Exercise your democratic right!",
      banner: "/placeholder.svg",
      registrationLink: "#",
      attendees: 1200
    }
  ];

  const pastEvents = [
    {
      id: 6,
      title: "Welcome Week 2024",
      date: "2024-09-02",
      venue: "Campus Wide",
      category: "Orientation",
      description: "Orientation week for new students featuring campus tours, faculty introductions, and social activities.",
      banner: "/placeholder.svg",
      attendees: 600
    },
    {
      id: 7,
      title: "Mental Health Awareness Campaign",
      date: "2024-08-15",
      venue: "Student Welfare Center",
      category: "Welfare",
      description: "Educational campaign promoting mental health awareness and available support services.",
      banner: "/placeholder.svg",
      attendees: 320
    },
    {
      id: 8,
      title: "Career Fair 2024",
      date: "2024-07-20",
      venue: "Main Campus Hall",
      category: "Career",
      description: "Annual career fair connecting students with potential employers and internship opportunities.",
      banner: "/placeholder.svg",
      attendees: 750
    }
  ];

  const categories = ["All", "Cultural", "Sports", "Academic", "Workshop", "Elections", "Orientation", "Welfare", "Career"];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const filteredUpcomingEvents = activeFilter === "All" 
    ? upcomingEvents 
    : upcomingEvents.filter(event => event.category === activeFilter);

  const filteredPastEvents = activeFilter === "All" 
    ? pastEvents 
    : pastEvents.filter(event => event.category === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
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

      {/* Filter Section */}
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
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't miss out on these exciting opportunities to engage, learn, and connect with fellow ESTAMites
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredUpcomingEvents.map((event) => (
              <Card key={event.id} className="group hover:shadow-card transition-all duration-300 overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={event.banner} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>{event.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {event.attendees} registered
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-primary mb-3">{event.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span>{formatDate(event.date)}</span>
                      {event.endDate && event.endDate !== event.date && (
                        <span className="text-muted-foreground">
                          - {formatDate(event.endDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-accent" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                  
                  <Button className="w-full">
                    Register Now <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Past Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Celebrating our successful events and the memories we've created together
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPastEvents.map((event) => (
              <Card key={event.id} className="group hover:shadow-card transition-all duration-300 overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={event.banner} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{event.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {event.attendees} attended
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-primary mb-2">{event.title}</h3>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-accent" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-primary">
        <div className="container max-w-screen-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Have an Event Idea?
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            ESSA is always looking for creative ways to enhance student life. Share your ideas with us!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Submit Event Proposal
            </Button>
            <Button size="lg" variant="outline" className="btn-ghost-hero">
              Join Events Committee
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;