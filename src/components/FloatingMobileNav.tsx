import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, Users, Calendar, Heart, Mail, Info, FileText, GraduationCap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const FloatingMobileNav = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isMobile = useIsMobile();

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Info, href: "/about", label: "About" },
    { icon: Users, href: "/executives", label: "Executives" },
    { icon: GraduationCap, href: "/student-life", label: "Student Life" },
    { icon: Calendar, href: "/events", label: "Events" },
    { icon: FileText, href: "/constitution", label: "Constitution" },
    { icon: Heart, href: "/welfare", label: "Welfare" },
    { icon: Mail, href: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        if (currentScrollY > lastScrollY) {
          // Scrolling down - collapse
          setIsExpanded(false);
        } else if (lastScrollY - currentScrollY > 5) {
          // Scrolling up - expand
          setIsExpanded(true);
        }
      } else {
        // At top - always expanded
        setIsExpanded(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (!isMobile) return null;

  return (
    <div 
      className={`
        fixed top-4 z-50 transition-all duration-700 ease-out
        ${isExpanded 
          ? 'left-1/2 transform -translate-x-1/2' 
          : 'left-4 transform translate-x-0'
        }
      `}
    >
      <div 
        className={`
          bg-background/95 backdrop-blur-xl border border-border/20 shadow-glow
          transition-all duration-700 ease-out
          ${isExpanded 
            ? 'rounded-2xl px-4 py-3 w-96' 
            : 'rounded-full px-3 py-3 w-14'
          }
        `}
      >
        <div className="flex items-center relative h-8">
          {/* Logo - Always visible, positioned left in expanded, center in collapsed */}
          <Link 
            to="/" 
            className={`
              flex items-center z-10 transition-all duration-700 ease-out
              ${isExpanded ? 'absolute left-0' : 'justify-center w-full'}
            `}
          >
            <img 
              src="/essa-logo.png" 
              alt="ESTAM Logo" 
              className="h-8 w-8 object-contain transition-transform duration-300 hover:scale-110"
            />
          </Link>

          {/* Navigation Icons - Evenly spaced across remaining space */}
          <div 
            className={`
              flex items-center justify-evenly transition-all duration-700 ease-out
              ${isExpanded 
                ? 'opacity-100 translate-x-0 flex-1 ml-12' 
                : 'opacity-0 translate-x-8 w-0 overflow-hidden pointer-events-none'
              }
            `}
          >
            {navItems.slice(1).map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    p-2 rounded-xl text-muted-foreground hover:text-primary 
                    hover:bg-primary/10 transition-all duration-300
                    transform hover:scale-110 active:scale-95
                    ${isExpanded ? 'animate-fade-in' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 75}ms`
                  }}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subtle glow effect */}
      <div 
        className={`
          absolute -inset-1 bg-gradient-primary opacity-20 blur-sm -z-10
          transition-all duration-700 ease-out
          ${isExpanded 
            ? 'scale-100 rounded-2xl' 
            : 'scale-75 rounded-full'
          }
        `}
      />
    </div>
  );
};

export default FloatingMobileNav;