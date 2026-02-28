import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import ContestLeaderboard from "@/components/contest/ContestLeaderboard";
import ContestantGrid from "@/components/contest/ContestantGrid";
import VotingModal from "@/components/contest/VotingModal";
import { toast } from "sonner";

export interface Contestant {
  id: string;
  name: string;
  department: string;
  cover_image: string;
  total_votes: number;
  is_active: boolean;
}

const FashionContest = () => {
  useSEO({
    title: "Fashion Magazine Cover Contest",
    description: "Support your favorite Mass Communication student by voting for their magazine cover design. A fundraising-based voting contest.",
    keywords: "fashion contest, magazine cover, voting, ESTAM, mass communication, fundraising",
    url: "https://estam-sa.com/events/fashion-contest",
  });

  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [contestEnabled, setContestEnabled] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchContestants();
    fetchContestSettings();

    // Real-time subscription for vote updates
    const channel = supabase
      .channel("contestants-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contestants" },
        (payload) => {
          setContestants((prev) =>
            prev.map((c) =>
              c.id === payload.new.id
                ? { ...c, total_votes: (payload.new as any).total_votes }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle payment return
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (paymentStatus === "success" && reference) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { reference },
      });

      if (data?.verified) {
        toast.success("Payment verified! Votes have been added. Thank you for your support! 🎉");
        fetchContestants(); // Refresh
      } else {
        toast.error("Payment verification pending. Votes will be added shortly.");
      }
    } catch (err) {
      console.error("Verify error:", err);
    }
  };

  const fetchContestants = async () => {
    const { data, error } = await supabase
      .from("contestants")
      .select("*")
      .eq("is_active", true)
      .order("total_votes", { ascending: false });

    if (data) setContestants(data as Contestant[]);
    setLoading(false);
  };

  const fetchContestSettings = async () => {
    const { data } = await supabase
      .from("contest_settings")
      .select("is_enabled")
      .limit(1)
      .single();

    if (data) setContestEnabled(data.is_enabled);
  };

  const handleVote = (contestant: Contestant) => {
    if (!contestEnabled) {
      toast.error("Voting is currently closed.");
      return;
    }
    setSelectedContestant(contestant);
    setIsVotingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-hero py-16 md:py-24">
        <div className="container max-w-screen-xl text-center text-white px-4">
          <h1 className="font-heading font-bold text-4xl md:text-6xl mb-4">
            Fashion Magazine <span className="text-accent">Cover Contest</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-4">
            Mass Communication Students' Fundraising Voting Contest
          </p>
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
            <p className="text-sm text-white/80">
              ℹ️ This is a fundraising-based voting contest. Votes represent financial support for contestants.
            </p>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <ContestLeaderboard contestants={contestants} loading={loading} />

      {/* Contestants Grid */}
      <ContestantGrid
        contestants={contestants}
        loading={loading}
        contestEnabled={contestEnabled}
        onVote={handleVote}
      />

      {/* Voting Modal */}
      <VotingModal
        contestant={selectedContestant}
        isOpen={isVotingOpen}
        onClose={() => {
          setIsVotingOpen(false);
          setSelectedContestant(null);
        }}
      />

      <Footer />
    </div>
  );
};

export default FashionContest;
