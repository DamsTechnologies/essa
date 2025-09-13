import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>
                  By accessing and using the ESSA website and services, you accept and agree to 
                  be bound by the terms and provision of this agreement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Use of Services</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>You agree to use ESSA services only for lawful purposes and in ways that do not:</p>
                <ul>
                  <li>Infringe upon the rights of others</li>
                  <li>Restrict or inhibit anyone else's use of the services</li>
                  <li>Submit false, misleading, or harmful content</li>
                  <li>Violate any applicable laws or university policies</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anonymous Submissions</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>
                  While we provide anonymous submission services, users are responsible for the 
                  content they submit. Submissions should be respectful, constructive, and 
                  relevant to student welfare and university matters.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prohibited Content</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>The following types of content are prohibited:</p>
                <ul>
                  <li>Harassment, threats, or abusive language</li>
                  <li>Discriminatory or hateful content</li>
                  <li>Spam or irrelevant material</li>
                  <li>Content that violates privacy or confidentiality</li>
                  <li>Illegal or inappropriate material</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disclaimer</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>
                  ESSA provides services on an "as is" basis. We make no warranties about the 
                  completeness, reliability, or accuracy of information or services provided.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>
                  For questions about these Terms of Service, please contact:
                </p>
                <p>
                  <strong>Email:</strong> estamstudentsassociation2425@gmail.com<br />
                  <strong>Phone:</strong> +229 61 07 65 77
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfService;