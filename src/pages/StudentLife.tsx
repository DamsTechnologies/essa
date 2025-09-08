import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Trophy, Heart, GraduationCap, Music, Camera, BookOpen } from "lucide-react";

const StudentLife = () => {
  const clubs = [
    {
      id: 1,
      name: "ESTAM Debate Society",
      category: "Academic",
      description: "Developing critical thinking and public speaking skills through competitive debate.",
      icon: <BookOpen className="h-6 w-6" />,
      members: 45,
      contact: "debate@essa.estam.edu"
    },
    {
      id: 2,
      name: "Music & Arts Club",
      category: "Creative",
      description: "Celebrating musical talent and artistic expression across all genres.",
      icon: <Music className="h-6 w-6" />,
      members: 72,
      contact: "music@essa.estam.edu"
    },
    {
      id: 3,
      name: "Photography Society",
      category: "Creative",
      description: "Capturing campus life and developing photography skills through workshops.",
      icon: <Camera className="h-6 w-6" />,
      members: 38,
      contact: "photo@essa.estam.edu"
    },
    {
      id: 4,
      name: "Sports Committee",
      category: "Athletics",
      description: "Organizing inter-faculty tournaments and promoting sports excellence.",
      icon: <Trophy className="h-6 w-6" />,
      members: 120,
      contact: "sports@essa.estam.edu"
    },
    {
      id: 5,
      name: "Community Service",
      category: "Service",
      description: "Making a positive impact through volunteer work and community outreach.",
      icon: <Heart className="h-6 w-6" />,
      members: 65,
      contact: "service@essa.estam.edu"
    },
    {
      id: 6,
      name: "Academic Excellence",
      category: "Academic",
      description: "Peer tutoring, study groups, and academic support initiatives.",
      icon: <GraduationCap className="h-6 w-6" />,
      members: 89,
      contact: "academic@essa.estam.edu"
    }
  ];

  const advantages = [
    {
      title: "World-Class Education",
      description: "Access to cutting-edge curriculum designed by industry experts",
      icon: "🎓"
    },
    {
      title: "Global Community",
      description: "Connect with diverse students from around the world",
      icon: "🌍"
    },
    {
      title: "Industry Connections",
      description: "Direct links to top employers and internship opportunities",
      icon: "🤝"
    },
    {
      title: "Modern Facilities",
      description: "State-of-the-art labs, libraries, and recreational spaces",
      icon: "🏢"
    },
    {
      title: "Research Excellence",
      description: "Opportunities to work with leading researchers and projects",
      icon: "🔬"
    },
    {
      title: "Career Support",
      description: "Comprehensive career guidance and placement assistance",
      icon: "💼"
    }
  ];

  const categories = ["All", "Academic", "Creative", "Athletics", "Service"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Life as an <span className="text-accent">ESTAMITE</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
              Proudly Exceptional • Vibrantly Connected • Academically Excellence
            </p>
            <Button size="lg" className="btn-hero">
              Join Our Community <Users className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Advantages of Being an ESTAMITE
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience exceptional opportunities that set ESTAM students apart from the rest
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <Card key={index} className="group hover:shadow-card transition-all duration-300 animate-fade-in">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{advantage.icon}</div>
                  <h3 className="text-xl font-bold text-primary mb-3">{advantage.title}</h3>
                  <p className="text-muted-foreground">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clubs & Societies */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Clubs & Societies
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join vibrant communities that match your interests and help you grow beyond academics
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <Badge 
                key={category} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubs.map((club) => (
              <Card key={club.id} className="group hover:shadow-card transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {club.icon}
                    </div>
                    <Badge variant="secondary">{club.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{club.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{club.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {club.members} members
                    </span>
                    <Button variant="outline" size="sm">
                      Join Club
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Life Gallery */}
      <section className="py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Daily Campus Life
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the vibrant atmosphere and exceptional moments that define ESTAM
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer">
                <img 
                  src="/placeholder.svg" 
                  alt={`Campus life ${index}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              View Full Gallery <Camera className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-primary">
        <div className="container max-w-screen-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Join the ESTAM Family?
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Be part of an exceptional community where excellence meets opportunity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Apply Now
            </Button>
            <Button size="lg" variant="outline" className="btn-ghost-hero">
              Campus Tour
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StudentLife;