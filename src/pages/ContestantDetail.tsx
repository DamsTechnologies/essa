import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Share2, Loader2 } from "lucide-react";
import VotingModal from "@/components/contest/VotingModal";
import type { Contestant } from "@/pages/FashionContest";
import { toast } from "sonner";

const ContestantDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [contestEnabled, setContestEnabled] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchContestant();
      fetchContestSettings();
    }
  }, [slug]);

  useEffect(() => {
    if (!contestant) return;
    const channel = supabase
      .channel(`contestant-${contestant.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contestants", filter: `id=eq.${contestant.id}` }, (payload) => {
        setContestant((prev) => prev ? { ...prev, total_votes: (payload.new as any).total_votes } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [contestant?.id]);

  const fetchContestant = async () => {
    const { data } = await supabase
      .from("contestants")
      .select("*")
      .eq("slug", slug!)
      .eq("is_active", true)
      .single();

    if (data) {
      setContestant({
        id: data.id,
        name: data.name,
        design_title: data.design_title,
        cover_image: data.cover_image,
        profile_image: data.profile_image,
        total_votes: data.total_votes,
        is_active: data.is_active,
        slug: data.slug,
        design_description: data.design_description,
        biography: data.biography,
      });
    }
    setLoading(false);
  };

  const fetchContestSettings = async () => {
    const { data } = await supabase.from("contest_settings").select("is_enabled").limit(1).single();
    if (data) setContestEnabled(data.is_enabled);
  };

  const handleShare = async () => {
    const url = `https://theessa.vercel.app/contestant/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Vote for ${contestant?.name}`, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-32 px-4">
          <h1 className="text-2xl font-heading font-bold text-primary mb-4">Contestant Not Found</h1>
          <Button asChild><Link to="/competition"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Contest</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const displayImage = contestant.profile_image || contestant.cover_image;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-screen-lg px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/competition"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Contest</Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cover Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-premium">
              <img
                src={contestant.cover_image}
                alt={`${contestant.name}'s magazine cover`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={displayImage}
                alt={contestant.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-accent"
                loading="lazy"
              />
              <div>
                <h1 className="text-3xl font-heading font-bold text-primary">{contestant.name}</h1>
                <p className="text-muted-foreground">{contestant.design_title}</p>
              </div>
            </div>

            <div className="bg-accent/10 rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-accent">{contestant.total_votes.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Votes</p>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base"
                onClick={() => {
                  if (!contestEnabled) { toast.error("Voting is currently closed."); return; }
                  setIsVotingOpen(true);
                }}
                disabled={!contestEnabled}
              >
                <Heart className="h-5 w-5 mr-2" />
                {contestEnabled ? "Support This Contestant" : "Voting Closed"}
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {contestant.design_description && (
              <div>
                <h2 className="font-heading font-bold text-lg text-primary mb-2">Design Inspiration</h2>
                <p className="text-muted-foreground leading-relaxed">{contestant.design_description}</p>
              </div>
            )}

            {contestant.biography && (
              <div>
                <h2 className="font-heading font-bold text-lg text-primary mb-2">About the Contestant</h2>
                <p className="text-muted-foreground leading-relaxed">{contestant.biography}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <VotingModal
        contestant={contestant}
        isOpen={isVotingOpen}
        onClose={() => setIsVotingOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default ContestantDetail;
