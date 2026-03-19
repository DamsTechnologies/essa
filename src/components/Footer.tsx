import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container max-w-screen-2xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* ESSA Info */}
          <div>
          <div className="flex items-center space-x-3 mb-4">
            <img 
              src="/essa-logo.png" 
              alt="ESSA Logo" 
              className="h-10 w-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg leading-tight">ESTAM</span>
              <span className="text-xs text-primary-foreground/70 leading-tight">Students' Association</span>
            </div>
          </div>
            <p className="text-primary-foreground/80 mb-4">
              Representing and supporting ESTAM University students through advocacy, 
              welfare programs, and community building.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { label: "About ESSA", href: "/about" },
                { label: "Our Executives", href: "/executives" },
                { label: "Constitution", href: "/constitution" },
                { label: "Student Life", href: "/student-life" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-primary-foreground/80 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Student Services */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Student Services</h3>
            <ul className="space-y-2">
              {[
                { label: "Anonymous Suggestion Box", href: "/welfare" },
                { label: "Expression Corner", href: "/welfare" },
                { label: "Events & Activities", href: "/events" },
                { label: "Student Clubs", href: "/student-life" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-primary-foreground/80 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-primary-foreground/80">ESSA Office</p>
                  <p className="text-primary-foreground/60 text-sm">
                    Administrative Building,<br />
                    ESTAM University Campus
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent" />
                <a 
                  href="mailto:estamstudentsassociation2425@gmail.com" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  estamstudentsassociation2425@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-accent" />
                <a 
                  href="tel:+22950250897" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  +229 50 25 08 97
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-primary-foreground/60 text-sm space-y-1">
            <p>© 2026 ESSA - ESTAM Students' Association. All rights reserved.</p>
            <p>Built with ❤️ by <a href="#" className="text-accent hover:text-accent/80 transition-colors">Dams Technologies</a></p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
