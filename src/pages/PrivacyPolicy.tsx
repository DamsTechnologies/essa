import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>
                  ESSA collects information that you voluntarily provide when using our anonymous 
                  suggestion forms and expression corner. This may include:
                </p>
                <ul>
                  <li>Messages and feedback submitted through our forms</li>
                  <li>Optional contact information (email or WhatsApp) if you request a response</li>
                  <li>Basic usage analytics to improve our services</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>We use the collected information to:</p>
                <ul>
                  <li>Address student concerns and suggestions</li>
                  <li>Provide support services when requested</li>
                  <li>Improve ESSA services and student experience</li>
                  <li>Communicate with students about important matters</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anonymous Submissions</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>
                  Our anonymous forms are designed to protect your identity. We do not collect 
                  personal identifying information unless you specifically provide contact details 
                  and request a response. All submissions are treated with strict confidentiality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>
                  We implement appropriate security measures to protect your information against 
                  unauthorized access, alteration, disclosure, or destruction. However, no method 
                  of transmission over the internet is 100% secure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none">
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;