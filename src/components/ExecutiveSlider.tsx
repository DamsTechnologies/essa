import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExecutiveSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const executives = [
    {
      name: "Samuel Adebayo",
      position: "President",
      image: "/placeholder.svg",
      bio: "Leading ESSA with vision and dedication"
    },
    {
      name: "Fatima Mohammed",
      position: "Vice President",
      image: "/placeholder.svg",
      bio: "Supporting student initiatives and growth"
    },
    {
      name: "David Okonkwo",
      position: "General Secretary",
      image: "/placeholder.svg",
      bio: "Keeping records and facilitating communication"
    },
    {
      name: "Aisha Bello",
      position: "Welfare Director",
      image: "/placeholder.svg",
      bio: "Ensuring student well-being and support"
    },
    {
      name: "Michael Asante",
      position: "Public Relations Officer",
      image: "/placeholder.svg",
      bio: "Managing communications and outreach"
    },
    {
      name: "Grace Nkomo",
      position: "Social Director",
      image: "/placeholder.svg",
      bio: "Organizing social events and activities"
    },
    {
      name: "Ibrahim Hassan",
      position: "Treasurer",
      image: "/placeholder.svg",
      bio: "Managing finances and budgets"
    },
    {
      name: "Mary Okafor",
      position: "Sports Director",
      image: "/placeholder.svg",
      bio: "Promoting sports and fitness activities"
    },
    {
      name: "John Mensah",
      position: "Assistant Secretary",
      image: "/placeholder.svg",
      bio: "Supporting administrative duties"
    },
    {
      name: "Blessing Okoro",
      position: "Mr. Fresher",
      image: "/placeholder.svg",
      bio: "Representing first-year male students"
    },
    {
      name: "Aminata Diallo",
      position: "Miss Fresher",
      image: "/placeholder.svg",
      bio: "Representing first-year female students"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % executives.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [executives.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % executives.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + executives.length) % executives.length);
  };

  return (
    <div className="relative bg-gradient-primary rounded-2xl p-8 text-primary-foreground overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Current EXCO</h3>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={prevSlide}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={nextSlide}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden">
            <img 
              src={executives[currentSlide].image} 
              alt={executives[currentSlide].name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold text-accent mb-1">
              {executives[currentSlide].name}
            </h4>
            <p className="text-primary-foreground/80 font-medium mb-2">
              {executives[currentSlide].position}
            </p>
            <p className="text-primary-foreground/70 text-sm">
              {executives[currentSlide].bio}
            </p>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {executives.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-accent scale-125' 
                  : 'bg-primary-foreground/30 hover:bg-primary-foreground/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-12 -translate-x-12" />
    </div>
  );
};

export default ExecutiveSlider;