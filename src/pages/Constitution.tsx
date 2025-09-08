import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Download, FileText, Scale, Users } from "lucide-react";

const Constitution = () => {
  const constitutionSections = [
    {
      id: "preamble",
      title: "Preamble",
      content: `We, the students of ESTAM University, united in our commitment to academic excellence, mutual respect, and collective progress, hereby establish this Constitution for the ESTAM Students' Association (ESSA).

This Constitution serves as the foundational document governing our student body, ensuring democratic participation, protecting student rights, and promoting the general welfare of all ESTAM students.

We pledge to uphold the values of integrity, diversity, inclusion, and service as we strive to create an exceptional educational environment for present and future generations of ESTAMites.`
    },
    {
      id: "article-1",
      title: "Article I - Name and Purpose",
      content: `Section 1.1 - Name
The organization shall be known as the ESTAM Students' Association, hereinafter referred to as "ESSA."

Section 1.2 - Purpose
ESSA exists to:
- Represent the interests and welfare of all ESTAM University students
- Facilitate communication between students and university administration
- Organize cultural, academic, and social activities for student development
- Advocate for student rights and academic excellence
- Promote unity, diversity, and inclusion within the student body
- Provide a platform for democratic participation in university governance`
    },
    {
      id: "article-2",
      title: "Article II - Membership",
      content: `Section 2.1 - General Membership
All students enrolled at ESTAM University are automatically members of ESSA with full rights and privileges.

Section 2.2 - Rights of Members
Every ESSA member has the right to:
- Vote in all ESSA elections and referenda
- Hold office subject to eligibility requirements
- Participate in all ESSA programs and activities
- Access ESSA services and resources
- Petition for grievance redress
- Freedom of expression and peaceful assembly

Section 2.3 - Responsibilities of Members
Members are expected to:
- Uphold the values and principles of ESSA
- Respect the rights and dignity of fellow students
- Participate constructively in student governance
- Comply with university policies and regulations`
    },
    {
      id: "article-3",
      title: "Article III - Executive Structure",
      content: `Section 3.1 - Executive Committee
The Executive Committee shall consist of:
- President
- Vice President
- Secretary General
- Financial Secretary
- Welfare Director
- Sports Director
- Public Relations Officer

Section 3.2 - Terms of Office
- Executive positions serve for one academic year
- Elections held annually in December
- Terms begin January 1st and end December 31st

Section 3.3 - Eligibility Requirements
Candidates must:
- Be enrolled full-time at ESTAM University
- Maintain a minimum GPA of 3.0
- Have no outstanding disciplinary actions
- Submit nomination papers with 50 student signatures`
    },
    {
      id: "article-4",
      title: "Article IV - Powers and Duties",
      content: `Section 4.1 - Presidential Powers
The President shall:
- Serve as chief executive officer of ESSA
- Represent ESSA at university meetings and external functions
- Convene and preside over Executive Committee meetings
- Appoint committee chairs with Executive approval
- Sign official documents and agreements

Section 4.2 - Vice Presidential Duties
The Vice President shall:
- Assist the President in executive functions
- Assume Presidential duties in case of absence
- Coordinate inter-faculty relations
- Oversee academic affairs and student concerns

Section 4.3 - Secretary General Responsibilities
- Maintain accurate records of all meetings
- Handle official correspondence
- Manage ESSA archives and documentation
- Ensure transparency in decision-making processes`
    },
    {
      id: "article-5",
      title: "Article V - Financial Management",
      content: `Section 5.1 - Revenue Sources
ESSA finances derive from:
- Student activity fees
- University allocations
- Fundraising activities
- Sponsorships and partnerships
- Event proceeds

Section 5.2 - Financial Secretary Duties
- Maintain accurate financial records
- Prepare monthly and annual financial reports
- Process all expenditures and receipts
- Present budget proposals to the Executive Committee

Section 5.3 - Budget Approval
- Annual budget requires Executive Committee approval
- Major expenditures (>$500) require majority vote
- Financial reports published quarterly for transparency`
    },
    {
      id: "article-6",
      title: "Article VI - Elections and Governance",
      content: `Section 6.1 - Electoral Process
- Elections conducted annually in December
- Secret ballot voting system
- All registered students eligible to vote
- Electoral commission appointed by outgoing Executive

Section 6.2 - Campaign Regulations
- Campaign period: 14 days prior to election
- Equal access to campaign platforms
- Prohibition of vote buying and coercion
- Campaign spending limits apply

Section 6.3 - Voting Procedures
- Electronic voting system preferred
- Polling stations across campus
- Results announced within 48 hours
- Appeals process available for disputes`
    },
    {
      id: "article-7",
      title: "Article VII - Amendments and Ratification",
      content: `Section 7.1 - Amendment Process
Constitutional amendments require:
- Proposal by Executive Committee or 200 student signatures
- Two-thirds majority vote in student referendum
- University administration approval
- 30-day notice period before voting

Section 7.2 - Ratification
This Constitution becomes effective upon:
- Approval by two-thirds of voting students
- Ratification by ESTAM University administration
- Publication in official university gazette

Section 7.3 - Review Process
Constitution subject to comprehensive review every three years to ensure continued relevance and effectiveness.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20">
        <div className="container max-w-screen-2xl">
          <div className="text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Scale className="h-12 w-12 text-accent" />
              <h1 className="text-4xl md:text-6xl font-bold">
                ESSA <span className="text-accent">Constitution</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              The foundational document governing democratic student representation at ESTAM University
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 bg-muted/30">
        <div className="container max-w-screen-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">ESSA Constitution - Last Updated: September 2024</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Student Rights
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-12">
        <div className="container max-w-screen-2xl">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Table of Contents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {constitutionSections.map((section, index) => (
                  <a 
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {index + 1}
                    </span>
                    <span className="font-medium group-hover:text-primary transition-colors">
                      {section.title}
                    </span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Constitution Content */}
      <section className="py-12">
        <div className="container max-w-screen-2xl">
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {constitutionSections.map((section, index) => (
                <AccordionItem 
                  key={section.id} 
                  value={section.id}
                  id={section.id}
                  className="bg-background border rounded-lg shadow-card overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index === 0 ? 'P' : index}
                      </span>
                      <span className="text-left font-semibold">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="prose prose-sm max-w-none">
                      {section.content.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-4 text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Student Rights Summary */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-screen-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Student Rights & Responsibilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Key highlights from the ESSA Constitution ensuring democratic participation and student welfare
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Democratic Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Vote in all ESSA elections</li>
                  <li>• Run for executive positions</li>
                  <li>• Participate in referenda</li>
                  <li>• Access to grievance procedures</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-accent" />
                  Academic Rights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Quality education standards</li>
                  <li>• Fair assessment procedures</li>
                  <li>• Academic appeal processes</li>
                  <li>• Research opportunities</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Welfare Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Health and wellness support</li>
                  <li>• Financial aid advocacy</li>
                  <li>• Counseling services access</li>
                  <li>• Emergency assistance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-primary">
        <div className="container max-w-screen-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Questions About the Constitution?
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Our executive team is here to help you understand your rights and responsibilities as an ESTAMite
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Contact ESSA Executive
            </Button>
            <Button size="lg" variant="outline" className="btn-ghost-hero">
              Legal Affairs Committee
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Constitution;