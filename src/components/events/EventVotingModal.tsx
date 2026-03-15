import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contestant {
  id: string;
  name: string;
  profile_image: string | null;
  total_votes: number;
}

interface EventConfig {
  id: string;
  min_vote_amount: number;
  vote_conversion_rate: number;
  payment_currency: string;
}

interface Props {
  contestant: Contestant | null;
  event: EventConfig;
  isOpen: boolean;
  onClose: () => void;
}

const EventVotingModal = ({ contestant, event, isOpen, onClose }: Props) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [voterName, setVoterName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const rate = event.vote_conversion_rate || 100;
  const packages = [
    { votes: 1, amount: rate },
    { votes: 5, amount: rate * 5 },
    { votes: 10, amount: rate * 10 },
    { votes: 50, amount: rate * 50 },
  ];

  const effectiveAmount = isCustom ? Number(customAmount) : selectedAmount || 0;
  const effectiveVotes = Math.floor(effectiveAmount / rate);
  const effectiveAmountKobo = effectiveAmount * 100;

  const isValidCustom = isCustom && Number(customAmount) >= event.min_vote_amount && effectiveVotes >= 1;
  const canPay = email && (isCustom ? isValidCustom : !!selectedAmount);

  const handlePay = async () => {
    if (!canPay || !contestant) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error("Please enter a valid email"); return; }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("event-payment-initialize", {
        body: {
          email,
          voter_name: voterName || undefined,
          amount: effectiveAmountKobo,
          contestant_id: contestant.id,
          event_id: event.id,
          payment_type: isCustom ? "custom" : "package",
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Failed to initialize payment");
        setProcessing(false);
        return;
      }

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error("Failed to get payment URL");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setProcessing(false);
  };

  const resetAndClose = () => {
    setSelectedAmount(null);
    setEmail("");
    setVoterName("");
    setIsCustom(false);
    setCustomAmount("");
    onClose();
  };

  if (!contestant) return null;

  const currency = event.payment_currency === "NGN" ? "₦" : event.payment_currency;

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-accent" />
            Support {contestant.name}
          </DialogTitle>
          <DialogDescription>Purchase votes to support this contestant.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Contestant preview */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            {contestant.profile_image ? (
              <img src={contestant.profile_image} alt={contestant.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{contestant.name.charAt(0)}</div>
            )}
            <div>
              <p className="font-semibold text-foreground">{contestant.name}</p>
              <p className="text-sm text-muted-foreground">Current: {contestant.total_votes.toLocaleString()} votes</p>
            </div>
          </div>

          {/* Packages */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Select Vote Package</Label>
            <div className="grid grid-cols-2 gap-2">
              {packages.map((pkg) => (
                <button key={pkg.votes} onClick={() => { setSelectedAmount(pkg.amount); setIsCustom(false); }}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    !isCustom && selectedAmount === pkg.amount ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                  }`}>
                  <p className="font-bold text-foreground text-lg">{pkg.votes}</p>
                  <p className="text-xs text-muted-foreground">{pkg.votes === 1 ? "vote" : "votes"}</p>
                  <p className="text-sm font-semibold text-accent mt-1">{currency}{pkg.amount.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <button onClick={() => { setIsCustom(true); setSelectedAmount(null); }}
              className={`w-full p-3 rounded-lg border-2 text-center transition-all ${
                isCustom ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
              }`}>
              <p className="font-medium text-foreground">Enter Custom Amount</p>
              <p className="text-xs text-muted-foreground">{currency}{rate} = 1 Vote (min {currency}{event.min_vote_amount})</p>
            </button>
            {isCustom && (
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                  <Input type="number" placeholder="Enter amount" value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)} className="pl-8" min={event.min_vote_amount} />
                </div>
                {customAmount && Number(customAmount) >= event.min_vote_amount && (
                  <p className="text-sm text-accent font-medium mt-2">
                    {currency}{Number(customAmount).toLocaleString()} = {effectiveVotes} vote{effectiveVotes !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Voter info */}
          <div className="space-y-3">
            <div>
              <Label>Your Name (optional)</Label>
              <Input value={voterName} onChange={(e) => setVoterName(e.target.value)} maxLength={100} placeholder="Enter your name" />
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="your@email.com" />
            </div>
          </div>

          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base"
            disabled={!canPay || processing} onClick={handlePay}>
            {processing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Heart className="h-5 w-5 mr-2" />}
            {processing ? "Processing..." : canPay
              ? `Pay ${currency}${effectiveAmount.toLocaleString()} for ${effectiveVotes} Vote${effectiveVotes > 1 ? "s" : ""}`
              : "Select a package"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">Secured by Paystack</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventVotingModal;
