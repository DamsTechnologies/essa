import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface FormSubmissionProps {
  type: "suggestion" | "expression";
  onBack: () => void;
}

const FormSubmission = ({ type, onBack }: FormSubmissionProps) => {
  const messages = {
    suggestion: {
      title: "Suggestion Submitted Successfully!",
      message: "Thank you for sharing your ideas with us. Your suggestion has been received and will be reviewed by the ESSA team.",
      email: "Your feedback helps us improve the ESTAM experience for all students."
    },
    expression: {
      title: "Message Sent Successfully!",
      message: "Thank you for trusting us with your thoughts. Your message has been received confidentially.",
      email: "If you provided contact information and requested a response, our welfare team will reach out to you soon."
    }
  };

  const currentMessage = messages[type];

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="text-center py-8">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">
              {currentMessage.title}
            </h3>
            <p className="text-green-700 mb-4">
              {currentMessage.message}
            </p>
            <p className="text-sm text-green-600">
              {currentMessage.email}
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onBack}
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Submit Another {type === "suggestion" ? "Suggestion" : "Message"}
            </Button>
            
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link to="/">
                Return to Homepage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormSubmission;