import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Eye, 
  Users, 
  Megaphone, 
  Heart, 
  BookOpen,
  Shield,
  HandHeart,
  Lightbulb
} from "lucide-react";

const About = () => {
  const responsibilities = [
    {
      icon: Megaphone,
      title: "Student Advocacy",
      description: "Representing student interests in university governance and policy-making."
    },
    {
      icon: Heart,
      title: "Welfare Support",
      description: "Providing mental health resources, counseling referrals, and student support services."
    },
    {
      icon: Users,
      title: "Community Building",
      description: "Organizing events, activities, and programs that bring students together."
    },
    {
      icon: BookOpen,
      title: "Academic Support",
      description: "Facilitating academic resources, study groups, and educational workshops."
    },
    {
      icon: Shield,
      title: "Rights Protection",
      description: "Ensuring student rights are respected and protected across campus."
    },
    {
      icon: HandHeart,
      title: "Crisis Intervention",
      description: "Providing immediate support and resources during student emergencies."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-primary text-primary-foreground">
        <div className="container max-w-screen-xl">
          <div className="text-center">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">About ESSA</Badge>
            <h1 className="font-heading font-bold text-5xl md:text-7xl mb-6">
              Who We Are
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-primary-foreground/90">
              The ESTAM Students' Association is your official voice at ESTAM University, 
              dedicated to advocacy, welfare, and community building.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container max-w-screen-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-8 w-8 text-accent" />
                <h2 className="font-heading font-bold text-3xl text-primary">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                To serve as the official representative body of ESTAM University students, 
                advocating for their rights, welfare, and interests while fostering a 
                vibrant, inclusive campus community.
              </p>
              <p className="text-muted-foreground">
                We bridge the gap between students and university administration, ensuring 
                every voice is heard and every concern is addressed with care and urgency.
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-8 w-8 text-accent" />
                <h2 className="font-heading font-bold text-3xl text-primary">Our Vision</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                To create an empowered student community where every individual thrives 
                academically, socially, and personally within a supportive and 
                innovative university environment.
              </p>
              <p className="text-muted-foreground">
                We envision ESTAM University as a place where students don't just learn, 
                but flourish - supported by strong advocacy, comprehensive welfare programs, 
                and meaningful connections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-screen-xl">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-primary">
              Our Core Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide every decision we make and every action we take.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-border/50 hover:border-accent/50 hover:shadow-card transition-all">
              <CardHeader>
                <div className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="font-heading text-xl">Inclusivity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every student, regardless of background, deserves equal representation 
                  and support in their university journey.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border/50 hover:border-accent/50 hover:shadow-card transition-all">
              <CardHeader>
                <div className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="font-heading text-xl">Integrity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We operate with transparency, honesty, and accountability in all 
                  our interactions and decisions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border/50 hover:border-accent/50 hover:shadow-card transition-all">
              <CardHeader>
                <div className="mx-auto mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Lightbulb className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="font-heading text-xl">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We continuously seek creative solutions and fresh approaches 
                  to enhance student life and university experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="py-16">
        <div className="container max-w-screen-xl">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4 text-primary">
              What We Do
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive approach to student support covers every aspect of university life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {responsibilities.map((item, index) => (
              <Card key={index} className="group hover:shadow-card transition-all border-border/50 hover:border-accent/50">
                <CardHeader>
                  <item.icon className="h-8 w-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
                  <CardTitle className="font-heading text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How We Operate */}
      <section className="py-16 bg-gradient-accent text-accent-foreground">
        <div className="container max-w-screen-xl">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              How We Operate
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Democratic governance, transparent processes, and student-centered decision making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-foreground/10">
                <Users className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Democratic Elections</h3>
              <p className="opacity-90">
                All EXCO positions are filled through fair, transparent elections 
                where every student has a voice.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-foreground/10">
                <Eye className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Open Governance</h3>
              <p className="opacity-90">
                Regular meetings, public reports, and open communication channels 
                ensure transparency in all our activities.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-foreground/10">
                <Heart className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">Student-Centered</h3>
              <p className="opacity-90">
                Every decision is made with student welfare and interests as our 
                primary consideration and guiding principle.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;