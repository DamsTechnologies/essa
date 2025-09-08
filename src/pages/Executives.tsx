import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Instagram, Linkedin, ExternalLink } from "lucide-react";

const Executives = () => {
  // Current ESSA Executives
  const currentExecutives = [
    {
      id: 1,
      name: "Sarah Johnson",
      position: "President",
      tenure: "2024-2025",
      photo: "/placeholder.svg",
      bio: "Leading ESSA with vision and dedication to student welfare.",
      email: "president@essa.estam.edu",
      socials: {
        instagram: "@sarahjohnson_essa",
        linkedin: "sarah-johnson-essa"
      }
    },
    {
      id: 2,
      name: "Michael Chen",
      position: "Vice President",
      tenure: "2024-2025",
      photo: "/placeholder.svg",
      bio: "Supporting student initiatives and academic excellence.",
      email: "vp@essa.estam.edu",
      socials: {
        instagram: "@mikechen_vp"
      }
    },
    {
      id: 3,
      name: "Amara Okafor",
      position: "Secretary General",
      tenure: "2024-2025",
      photo: "/placeholder.svg",
      bio: "Ensuring transparency and effective communication.",
      email: "secretary@essa.estam.edu",
      socials: {
        linkedin: "amara-okafor-essa"
      }
    },
    {
      id: 4,
      name: "David Rodriguez",
      position: "Financial Secretary",
      tenure: "2024-2025",
      photo: "/placeholder.svg",
      bio: "Managing ESSA finances with integrity and accountability.",
      email: "finance@essa.estam.edu"
    },
    {
      id: 5,
      name: "Fatima Al-Zahra",
      position: "Welfare Director",
      tenure: "2024-2025",
      photo: "/placeholder.svg",
      bio: "Championing student welfare and well-being initiatives.",
      email: "welfare@essa.estam.edu",
      socials: {
        instagram: "@fatima_welfare"
      }
    },
    {
      id: 6,
      name: "James Thompson",
      position: "Sports Director",
      tenure: "2024-2025",
      photo: "/placeholder.svg",
      bio: "Promoting sports excellence and healthy campus life.",
      email: "sports@essa.estam.edu"
    }
  ];

  // Past Executives by tenure
  const pastTenures = [
    {
      year: "2023-2024",
      executives: [
        { name: "Alexandra Williams", position: "President" },
        { name: "Emmanuel Adebayo", position: "Vice President" },
        { name: "Maria Santos", position: "Secretary General" },
        { name: "Robert Kim", position: "Financial Secretary" }
      ]
    },
    {
      year: "2022-2023",
      executives: [
        { name: "Ahmed Hassan", position: "President" },
        { name: "Catherine Brown", position: "Vice President" },
        { name: "Luis Martinez", position: "Secretary General" },
        { name: "Priya Sharma", position: "Financial Secretary" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ESSA <span className="text-accent">Executives</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Meet the dedicated leaders representing ESTAM students with excellence and integrity
            </p>
          </div>
        </div>
      </section>

      {/* Current Executives */}
      <section className="py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Current Executive Committee
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our 2024-2025 executive team is committed to serving every ESTAMITE with dedication and transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentExecutives.map((exec) => (
              <Card key={exec.id} className="group hover:shadow-card transition-all duration-300 overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={exec.photo} 
                    alt={exec.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-primary mb-2">{exec.name}</h3>
                    <Badge variant="outline" className="mb-2">{exec.position}</Badge>
                    <p className="text-sm text-muted-foreground">{exec.tenure}</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    {exec.bio}
                  </p>

                  {/* Contact & Socials */}
                  <div className="flex justify-center items-center gap-3">
                    {exec.email && (
                      <a 
                        href={`mailto:${exec.email}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                    {exec.socials?.instagram && (
                      <a 
                        href={`https://instagram.com/${exec.socials.instagram}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {exec.socials?.linkedin && (
                      <a 
                        href={`https://linkedin.com/in/${exec.socials.linkedin}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Past Executives */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Past Executive Tenures
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Honoring the legacy of previous ESSA leaders who built the foundation for our success
            </p>
          </div>

          <div className="space-y-12">
            {pastTenures.map((tenure) => (
              <div key={tenure.year} className="bg-background rounded-lg shadow-card p-8">
                <h3 className="text-2xl font-bold text-primary mb-6 text-center">
                  {tenure.year} Academic Year
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {tenure.executives.map((exec, index) => (
                    <div key={index} className="text-center">
                      <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-primary-foreground font-bold text-xl">
                          {exec.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-primary">{exec.name}</h4>
                      <p className="text-sm text-muted-foreground">{exec.position}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Executives;