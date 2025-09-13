import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import FloatingMobileNav from "./FloatingMobileNav";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Executives", href: "/executives" },
    { label: "Student Life", href: "/student-life" },
    { label: "Events", href: "/events" },
    { label: "Constitution", href: "/constitution" },
    { label: "Welfare", href: "/welfare" },
    { label: "Contact", href: "/contact" },
  ];

  // Show floating nav on mobile, regular header on desktop
  if (isMobile) {
    return <FloatingMobileNav />;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src="/essa-logo.png" 
            alt="ESSA Logo" 
            className="h-10 w-10 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-heading font-bold text-primary text-lg leading-tight">ESTAM</span>
            <span className="text-xs text-muted-foreground leading-tight">Students' Association</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              <Link to={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link to="/welfare">Anonymous Forms</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <nav className="container py-4 space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className="w-full justify-start text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                <Link to={item.href}>{item.label}</Link>
              </Button>
            ))}
            <div className="pt-2 border-t border-border/20">
              <Button variant="outline" asChild className="w-full">
                <Link to="/welfare" onClick={() => setIsMenuOpen(false)}>
                  Anonymous Forms
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;