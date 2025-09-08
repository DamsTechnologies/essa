import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, MessageSquare, Instagram, Facebook, Twitter } from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log("Contact form submitted:", contactForm);
    alert("Thank you for your message! We'll get back to you within 24 hours.");
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  const contactInfo = [
    {
      icon: <MapPin className="h-6 w-6 text-accent" />,
      title: "ESSA Office Location",
      details: [
        "Student Center, 2nd Floor",
        "ESTAM University Campus",
        "Building A, Room 205"
      ]
    },
    {
      icon: <Mail className="h-6 w-6 text-accent" />,
      title: "Email Addresses",
      details: [
        "General: essa@estam.edu",
        "President: president@essa.estam.edu",
        "Welfare: welfare@essa.estam.edu"
      ]
    },
    {
      icon: <Phone className="h-6 w-6 text-accent" />,
      title: "Phone Numbers",
      details: [
        "Main Office: +1 (234) 567-8900",
        "Emergency: +1 (234) 567-8911",
        "WhatsApp: +1 (234) 567-8922"
      ]
    },
    {
      icon: <Clock className="h-6 w-6 text-accent" />,
      title: "Office Hours",
      details: [
        "Monday - Friday: 8:00 AM - 6:00 PM",
        "Saturday: 10:00 AM - 2:00 PM",
        "Sunday: Closed"
      ]
    }
  ];

  const socialLinks = [
    {
      icon: <Instagram className="h-5 w-5" />,
      name: "Instagram",
      handle: "@essa_estam",
      url: "https://instagram.com/essa_estam",
      color: "hover:text-pink-500"
    },
    {
      icon: <Facebook className="h-5 w-5" />,
      name: "Facebook",
      handle: "ESSA ESTAM University",
      url: "https://facebook.com/essaestam",
      color: "hover:text-blue-500"
    },
    {
      icon: <Twitter className="h-5 w-5" />,
      name: "Twitter",
      handle: "@ESSAEstam",
      url: "https://twitter.com/essaestam",
      color: "hover:text-blue-400"
    }
  ];

  const quickLinks = [
    { title: "Academic Support", action: "Get help with your studies" },
    { title: "Welfare Services", action: "Access student support services" },
    { title: "Event Planning", action: "Organize campus events" },
    { title: "Constitutional Issues", action: "Learn about student rights" },
    { title: "Emergency Support", action: "Get immediate assistance" },
    { title: "Feedback & Suggestions", action: "Share your ideas with us" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-6">
              <MessageSquare className="h-12 w-12 text-accent" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Contact <span className="text-accent">ESSA</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              We're here to serve every ESTAMite. Reach out anytime for support, questions, or suggestions.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20">
        <div className="container max-w-screen-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center hover:shadow-card transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {info.icon}
                  </div>
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {info.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-sm text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-screen-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <p className="text-muted-foreground">
                  Have a question, suggestion, or need support? We'd love to hear from you!
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Full Name</label>
                      <Input 
                        placeholder="Your full name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email Address</label>
                      <Input 
                        type="email"
                        placeholder="your@email.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input 
                      placeholder="What's this about?"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea 
                      placeholder="Tell us how we can help you..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Campus Map */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-2xl">Find Us on Campus</CardTitle>
                <p className="text-muted-foreground">
                  Visit our office in the Student Center for in-person assistance and support.
                </p>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground">Interactive Campus Map</p>
                    <p className="text-sm text-muted-foreground">Coming Soon</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium">ESSA Office</p>
                      <p className="text-sm text-muted-foreground">
                        Student Center, 2nd Floor<br />
                        Building A, Room 205
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Office Hours</p>
                      <p className="text-sm text-muted-foreground">Mon-Fri: 8AM-6PM</p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6">
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Media & Quick Actions */}
      <section className="py-20">
        <div className="container max-w-screen-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Social Media */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">Follow Us</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Stay connected with ESSA for the latest updates, events, and student opportunities.
              </p>
              
              <div className="space-y-4">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.url}
                    className={`flex items-center gap-4 p-4 rounded-lg border hover:shadow-card transition-all duration-300 ${social.color}`}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {social.icon}
                    </div>
                    <div>
                      <p className="font-medium">{social.name}</p>
                      <p className="text-sm text-muted-foreground">{social.handle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">Quick Actions</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Common reasons students contact us. Click any option for immediate assistance.
              </p>
              
              <div className="space-y-3">
                {quickLinks.map((link, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border hover:shadow-card transition-all duration-300 cursor-pointer group"
                  >
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.action}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      →
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-20 bg-gradient-primary">
        <div className="container max-w-screen-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Need Immediate Assistance?
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            For urgent matters requiring immediate attention, contact our emergency support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Phone className="h-5 w-5 mr-2" />
              Emergency Hotline
            </Button>
            <Button size="lg" variant="outline" className="btn-ghost-hero">
              <MessageSquare className="h-5 w-5 mr-2" />
              WhatsApp Support
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;