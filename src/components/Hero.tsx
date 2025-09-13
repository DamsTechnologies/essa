import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Heart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-campus.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="ESTAM University Campus" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-primary/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container max-w-screen-xl text-center text-white px-4">
        <div className="animate-fade-in">
          <h1 className="font-heading font-bold text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight">
            <span className="text-white">ESSA</span>
            <br />
            <span className="text-accent">Students' Association</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-white/90">
            Your voice. Your community. Your future at ESTAM University.
            <br />
            Building bridges between students and administration.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="text-white/90">5,000+ Students</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent" />
              <span className="text-white/90">Student Welfare</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              <span className="text-white/90">Anonymous Support</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="hero" asChild className="px-8 py-6 text-lg">
              <Link to="/about" className="flex items-center gap-2">
                Explore ESSA
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button size="lg" variant="ghost-hero" asChild className="px-8 py-6 text-lg">
              <Link to="/constitution" className="flex items-center gap-2">
                Read Constitution
              </Link>
            </Button>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;