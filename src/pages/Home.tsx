import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Heart, 
  MessageSquare, 
  Calendar, 
  Award, 
  BookOpen,
  ArrowRight,
  Shield,
  Lightbulb,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Anonymous Suggestion Box",
      description: "Share your thoughts, concerns, and ideas safely and anonymously.",
      href: "/welfare",
      badge: "Popular"
    },
    {
      icon: Heart,
      title: "Expression Corner",
      description: "A safe space for emotional support and mental health resources.",
      href: "/welfare",
      badge: "Confidential"
    },
    {
      icon: Users,
      title: "Student Representation",
      description: "Your elected executives advocating for student rights and needs.",
      href: "/executives"
    },
    {
      icon: Calendar,
      title: "Events & Activities",
      description: "Join exciting campus events, workshops, and social activities.",
      href: "/events"
    }
  ];

  const values = [
    {
      icon: Shield,
      title: "Advocacy",
      description: "Standing up for student rights and representing your voice to university administration."
    },
    {
      icon: Heart,
      title: "Welfare",
      description: "Supporting student well-being through mental health resources and support systems."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Bringing fresh ideas and modern solutions to improve campus life."
    },
    {
      icon: Globe,
      title: "Community",
      description: "Building connections and fostering a sense of belonging among all students."
    }
  ];

  const stats = [
    { number: "5,000+", label: "Students Represented" },
    { number: "50+", label: "Clubs & Societies" },
    { number: "200+", label: "Events Annually" },
    { number: "24/7", label: "Anonymous Support" }
  ];

  return (
    <div className="min-h-screen">
      <Hero />
      
      {/* Why Join ESSA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-screen-xl">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-primary">
              Why Join ESSA?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're more than just a student association - we're your advocates, 
              your support system, and your voice at ESTAM University.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-card transition-all duration-300 border-border/50 hover:border-accent/50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <feature.icon className="h-8 w-8 text-accent group-hover:scale-110 transition-transform" />
                    {feature.badge && (
                      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="font-heading text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{feature.description}</CardDescription>
                  {feature.href && (
                    <Button variant="ghost" size="sm" asChild className="text-accent hover:text-accent/80 p-0">
                      <Link to={feature.href} className="flex items-center gap-1">
                        Learn more <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-primary text-primary-foreground">
        <div className="container max-w-screen-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-heading font-bold text-4xl md:text-5xl mb-2 text-accent">
                  {stat.number}
                </div>
                <div className="text-primary-foreground/80 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16">
        <div className="container max-w-screen-xl">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-primary">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do for the ESTAM student community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center group">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <value.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-2 text-primary">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current EXCO Teaser */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-screen-xl">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-primary">
              Meet Your EXCO
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Dedicated students working tirelessly to represent your interests and improve campus life.
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
              <Link to="/executives" className="flex items-center gap-2">
                View All Executives
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-accent text-accent-foreground">
        <div className="container max-w-screen-xl text-center">
          <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4">
            Get Involved Today
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Your voice matters. Join ESSA's mission to create a better university experience for all students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/welfare">Submit Anonymous Feedback</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;