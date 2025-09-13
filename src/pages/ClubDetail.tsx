import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Calendar, Trophy, Award, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const ClubDetail = () => {
  const { slug } = useParams();
  
  const clubsData = {
    "face-of-estam": {
      name: "Face of Estam (FOE)",
      category: "Creative",
      description: "Face of Estam celebrates beauty, talent, and representation across ESTAM University, providing a platform for students to showcase their confidence and creativity.",
      fullDescription: "FOE is more than just a beauty pageant - it's a celebration of the diverse talents, intelligence, and leadership qualities of ESTAM students. Our annual competition includes talent shows, academic challenges, and community service projects.",
      members: 156,
      contact: "foe@essa.estam.edu",
      founded: "2019",
      achievements: [
        "National University Pageant Winners 2023",
        "Community Service Award 2022",
        "Cultural Ambassador Program"
      ],
      events: [
        "Annual FOE Competition",
        "Beauty & Brains Workshop",
        "Community Outreach Programs"
      ]
    },
    "estam-football-club": {
      name: "Estam Football Club (ESTAM FC)",
      category: "Athletics",
      description: "Premier football club representing ESTAM in inter-university competitions and developing athletic excellence.",
      fullDescription: "ESTAM FC is our pride in sports, competing at the highest level of university football. We focus on developing both male and female football teams, providing professional training and opportunities to represent the university nationally and internationally.",
      members: 89,
      contact: "football@essa.estam.edu",
      founded: "2015",
      achievements: [
        "West African University Cup Champions 2023",
        "National University League Runners-up 2022", 
        "Fair Play Award 2021"
      ],
      events: [
        "Inter-Faculty Tournament",
        "Alumni vs Current Students Match",
        "Football Skills Development Camp"
      ]
    },
    // ... Add other clubs data
  };

  const club = clubsData[slug as keyof typeof clubsData];

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Club Not Found</h1>
          <Link to="/student-life">
            <Button>Back to Student Life</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center text-white">
            <Badge variant="secondary" className="mb-4 bg-accent/20 text-accent border-accent/30">
              {club.category}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {club.name}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              {club.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Join Club
              </Button>
              <Button size="lg" variant="outline" className="btn-ghost-hero">
                <Mail className="mr-2 h-5 w-5" />
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Club Info */}
      <section className="py-20">
        <div className="container max-w-screen-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>About {club.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {club.fullDescription}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {club.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Regular Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {club.events.map((event, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Club Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">{club.members}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Founded</span>
                    <span className="font-semibold">{club.founded}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline">{club.category}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Get Involved</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Ready to join {club.name}? Contact us or attend one of our events to get started.
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full" size="lg">
                      Join Now
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Club
                    </Button>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Email: {club.contact}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Related Clubs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Explore other clubs that might interest you.
                  </p>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/student-life">
                      View All Clubs
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ClubDetail;