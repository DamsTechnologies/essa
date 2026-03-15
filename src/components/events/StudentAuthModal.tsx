import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, GraduationCap, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ─── Matric number format: YY + 2 uppercase letters + 9 digits (13 chars total)
// e.g. 24EF021030058
const MATRIC_REGEX = /^\d{2}[A-Z]{2}\d{9}$/;

const validateMatric = (matric: string): { valid: boolean; message: string } => {
  const cleaned = matric.trim().toUpperCase();
  if (!cleaned) return { valid: false, message: "" };
  if (cleaned.length !== 13) {
    return { valid: false, message: `Must be 13 characters (yours is ${cleaned.length})` };
  }
  if (!MATRIC_REGEX.test(cleaned)) {
    return {
      valid: false,
      message: "Format: 2 digits + 2 letters + 9 digits (e.g. 24EF021030058)",
    };
  }
  return { valid: true, message: "Format looks correct ✓" };
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<{ error?: string }>;
  onSignup: (data: any) => Promise<{ error?: string }>;
}

const StudentAuthModal = ({ isOpen, onClose, onLogin, onSignup }: Props) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const matricValidation = validateMatric(matricNumber);
  const matricCleaned = matricNumber.trim().toUpperCase();

  const handleLogin = async () => {
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    const result = await onLogin(email, password);
    if (result.error) toast.error(result.error);
    else { toast.success("Logged in successfully!"); onClose(); }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!firstName || !lastName || !signupEmail || !matricNumber || !signupPassword) {
      toast.error("Please fill in all required fields"); return;
    }

    // Enforce matric format before hitting the server
    if (!matricValidation.valid) {
      toast.error("Please enter a valid matriculation number");
      return;
    }

    if (signupPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (signupPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    const result = await onSignup({
      first_name: firstName,
      last_name: lastName,
      email: signupEmail,
      matric_number: matricCleaned, // always store uppercase
      department: department || undefined,
      gender: gender || undefined,
      date_of_birth: dob || undefined,
      password: signupPassword,
    });

    if (result.error) toast.error(result.error);
    else {
      toast.success("Account created! You can now vote.");
      onClose();
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setMode("login");
    setEmail(""); setPassword("");
    setFirstName(""); setLastName(""); setSignupEmail("");
    setMatricNumber(""); setDepartment(""); setGender("");
    setDob(""); setSignupPassword(""); setConfirmPassword("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetAndClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {mode === "login" ? "Student Login" : "Student Registration"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Log in to cast your vote"
              : "Only registered ESTAM students can participate in voting"}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email Address</Label>
              <Input id="login-email" type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" placeholder="Enter password" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sign In
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <button className="text-primary font-medium hover:underline" onClick={() => setMode("signup")}>
                Register here
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Notice banner */}
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registration is open to <strong>ESTAM students only</strong>. Your matric number will be verified against the student register. If your registration is declined, contact the ESSA admin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
              </div>
            </div>

            <div>
              <Label>Email Address *</Label>
              <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} maxLength={255} />
            </div>

            {/* Matric number with live validation */}
            <div>
              <Label>Matriculation Number *</Label>
              <div className="relative">
                <Input
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                  maxLength={13}
                  placeholder="e.g. 23EF021030058"
                  className={`pr-9 font-mono tracking-wider ${
                    matricNumber && !matricValidation.valid
                      ? "border-destructive focus-visible:ring-destructive"
                      : matricNumber && matricValidation.valid
                      ? "border-green-500 focus-visible:ring-green-500"
                      : ""
                  }`}
                />
                {matricNumber && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {matricValidation.valid
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <XCircle className="h-4 w-4 text-destructive" />
                    }
                  </div>
                )}
              </div>
              {matricNumber && (
                <p className={`text-xs mt-1 ${matricValidation.valid ? "text-green-600" : "text-destructive"}`}>
                  {matricValidation.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Format: 2-digit year + faculty code + 9 digits (13 characters total)
              </p>
            </div>

            <div>
              <Label>Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={100}
                placeholder="e.g. Computer Science" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Password *</Label>
              <Input type="password" value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div>
              <Label>Confirm Password *</Label>
              <Input type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <Button
              className="w-full"
              onClick={handleSignup}
              disabled={loading || (!!matricNumber && !matricValidation.valid)}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Account
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <button className="text-primary font-medium hover:underline" onClick={() => setMode("login")}>
                Sign in
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentAuthModal;
