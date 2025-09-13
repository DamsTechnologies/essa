import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();

  useSEO({
    title: "Page Not Found - 404 Error",
    description: "The page you're looking for doesn't exist. Return to ESTAM Students' Association homepage to continue browsing.",
    keywords: "404, page not found, ESTAM, error page, student association",
    url: `https://estam-sa.com${location.pathname}`
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* ESTAM Logo/Branding */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
            <span className="text-2xl font-heading font-bold text-primary-foreground">E</span>
          </div>
          <h2 className="text-lg font-heading text-muted-foreground">ESTAM Students' Association</h2>
        </div>

        {/* 404 Display */}
        <div className="mb-8">
          <h1 className="text-8xl font-heading font-bold text-primary mb-4 animate-slide-in">404</h1>
          <h3 className="text-2xl font-heading text-foreground mb-2">Page Not Found</h3>
          <p className="text-muted-foreground">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            asChild 
            variant="default" 
            size="lg" 
            className="shadow-card"
          >
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            size="lg"
            onClick={() => window.history.back()}
          >
            <button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Need help? Visit our main sections:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button asChild variant="ghost" size="sm">
              <Link to="/about">About</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/events">Events</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/contact">Contact</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
