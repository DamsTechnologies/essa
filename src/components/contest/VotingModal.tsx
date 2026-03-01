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
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const computedCustomVotes = Math.floor(Number(customAmount) / 100);
  const effectiveAmount = isCustom ? Number(customAmount) : selectedPackage?.amount || 0;
  const effectiveVotes = isCustom ? computedCustomVotes : selectedPackage?.votes || 0;
  const effectiveAmountKobo = effectiveAmount * 100;

  const isValidCustom = isCustom && Number(customAmount) >= 100 && computedCustomVotes >= 1;
  const canPay = email && (isCustom ? isValidCustom : !!selectedPackage);

  const handlePay = async () => {
    if (!canPay || !contestant) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (isCustom && (Number(customAmount) > 1000000 || Number(customAmount) < 100)) {
      toast.error("Custom amount must be between ₦100 and ₦1,000,000");
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          email,
          voter_name: voterName || undefined,
          amount: effectiveAmountKobo,
          votes: effectiveVotes,
          contestant_id: contestant.id,
          payment_type: isCustom ? "custom" : "package",
        },
      });

      if (error) {
        toast.error("Failed to initialize payment. Please try again.");
        setProcessing(false);
        return;
      }

      if (data?.authorization_url) {
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
    setIsCustom(false);
    setCustomAmount("");
    onClose();
  };

  if (!contestant) return null;

  const displayImage = contestant.profile_image || contestant.cover_image;

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              src={displayImage}
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
                  onClick={() => { setSelectedPackage(pkg); setIsCustom(false); }}
                  className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                    !isCustom && selectedPackage?.votes === pkg.votes
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

          {/* Custom Amount */}
          <div>
            <button
              onClick={() => { setIsCustom(true); setSelectedPackage(null); }}
              className={`w-full p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                isCustom ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
              }`}
            >
              <p className="font-medium text-foreground">Enter Custom Support Amount</p>
              <p className="text-xs text-muted-foreground">₦100 = 1 Vote (minimum ₦100)</p>
            </button>
            {isCustom && (
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-8"
                    min={100}
                    max={1000000}
                  />
                </div>
                {customAmount && Number(customAmount) >= 100 && (
                  <p className="text-sm text-accent font-medium mt-2">
                    You are supporting with ₦{Number(customAmount).toLocaleString()} equivalent to {computedCustomVotes} vote{computedCustomVotes !== 1 ? "s" : ""}
                  </p>
                )}
                {customAmount && Number(customAmount) > 0 && Number(customAmount) < 100 && (
                  <p className="text-sm text-destructive mt-2">Minimum amount is ₦100</p>
                )}
              </div>
            )}
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
            disabled={!canPay || processing}
            onClick={handlePay}
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Heart className="h-5 w-5 mr-2" />
            )}
            {processing
              ? "Processing..."
              : canPay
              ? `Pay ₦${effectiveAmount.toLocaleString()} for ${effectiveVotes} Vote${effectiveVotes > 1 ? "s" : ""}`
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
