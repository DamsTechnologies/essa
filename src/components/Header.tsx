import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">E</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-primary text-lg leading-tight">ESSA</span>
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