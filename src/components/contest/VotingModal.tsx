import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Contestant } from "@/pages/FashionContest";

interface Props {
  contestant: Contestant | null;
  isOpen: boolean;
  onClose: () => void;
}

const VOTE_PACKAGES = [
  { votes: 1, amount: 100, amountKobo: 10000, label: "₦100 = 1 Vote" },
  { votes: 5, amount: 500, amountKobo: 50000, label: "₦500 = 5 Votes" },
  { votes: 10, amount: 1000, amountKobo: 100000, label: "₦1,000 = 10 Votes" },
  { votes: 50, amount: 5000, amountKobo: 500000, label: "₦5,000 = 50 Votes" },
];

const VotingModal = ({ contestant, isOpen, onClose }: Props) => {
  const [selectedPackage, setSelectedPackage] = useState<typeof VOTE_PACKAGES[0] | null>(null);
  const [email, setEmail] = useState("");
  const [voterName, setVoterName] = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!selectedPackage || !email || !contestant) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          email,
          voter_name: voterName || undefined,
          amount: selectedPackage.amountKobo,
          votes: selectedPackage.votes,
          contestant_id: contestant.id,
        },
      });

      if (error) {
        toast.error("Failed to initialize payment. Please try again.");
        setProcessing(false);
        return;
      }

      if (data?.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        toast.error("Failed to get payment URL. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Something went wrong. Please try again.");
    }

    setProcessing(false);
  };

  const resetAndClose = () => {
    setSelectedPackage(null);
    setEmail("");
    setVoterName("");
    onClose();
  };

  if (!contestant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-accent" />
            Support {contestant.name}
          </DialogTitle>
          <DialogDescription>
            Purchase votes to support this contestant. Each vote counts!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Contestant Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <img
              src={contestant.cover_image}
              alt={contestant.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-foreground">{contestant.name}</p>
              <p className="text-sm text-muted-foreground">
                Current: {contestant.total_votes.toLocaleString()} votes
              </p>
            </div>
          </div>

          {/* Vote Packages */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Select Vote Package</Label>
            <div className="grid grid-cols-2 gap-2">
              {VOTE_PACKAGES.map((pkg) => (
                <button
                  key={pkg.votes}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                    selectedPackage?.votes === pkg.votes
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <p className="font-bold text-foreground text-lg">{pkg.votes}</p>
                  <p className="text-xs text-muted-foreground">
                    {pkg.votes === 1 ? "vote" : "votes"}
                  </p>
                  <p className="text-sm font-semibold text-accent mt-1">₦{pkg.amount.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voter Info */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="voter-name">Your Name (optional)</Label>
              <Input
                id="voter-name"
                placeholder="Enter your name"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="voter-email">Email Address *</Label>
              <Input
                id="voter-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Payment receipt will be sent to this email
              </p>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base"
            disabled={!selectedPackage || !email || processing}
            onClick={handlePay}
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Heart className="h-5 w-5 mr-2" />
            )}
            {processing
              ? "Processing..."
              : selectedPackage
              ? `Pay ₦${selectedPackage.amount.toLocaleString()} for ${selectedPackage.votes} Vote${selectedPackage.votes > 1 ? "s" : ""}`
              : "Select a package"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secured by Paystack • Payments in Nigerian Naira (₦)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VotingModal;
