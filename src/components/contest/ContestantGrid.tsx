import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import type { Contestant } from "@/pages/FashionContest";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  contestants: Contestant[];
  loading: boolean;
  contestEnabled: boolean;
  onVote: (contestant: Contestant) => void;
}

const ContestantGrid = ({ contestants, loading, contestEnabled, onVote }: Props) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="py-12">
        <div className="container max-w-screen-xl px-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-[3/4] w-full rounded-t-lg" />
                <CardContent className="p-3 md:p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (contestants.length === 0) {
    return (
      <section className="py-20">
        <div className="container max-w-screen-xl px-4 text-center">
          <div className="max-w-md mx-auto">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold text-primary mb-2">No Contestants Yet</h3>
            <p className="text-muted-foreground">
              Contestants will be announced soon. Check back later!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container max-w-screen-xl px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-bold text-primary mb-2">All Contestants</h2>
          <p className="text-muted-foreground">Tap a cover to view details, or click "Support" to vote</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {contestants.map((contestant) => {
            const displayImage = contestant.profile_image || contestant.cover_image;
            return (
              <Card
                key={contestant.id}
                className="group overflow-hidden hover:shadow-card transition-all duration-300"
              >
                <div
                  className="aspect-[3/4] overflow-hidden relative cursor-pointer"
                  onClick={() => navigate(`/contestant/${contestant.slug || contestant.id}`)}
                >
                  <img
                    src={contestant.cover_image}
                    alt={`${contestant.name}'s magazine cover`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground rounded-full px-2 py-0.5 text-xs md:text-sm font-bold backdrop-blur-sm">
                    {contestant.total_votes.toLocaleString()} votes
                  </div>
                </div>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={displayImage}
                      alt={contestant.name}
                      className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-sm md:text-lg text-foreground truncate">
                        {contestant.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{contestant.design_title}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-sm h-9 md:h-10"
                    onClick={(e) => { e.stopPropagation(); onVote(contestant); }}
                    disabled={!contestEnabled}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {contestEnabled ? "Support" : "Closed"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContestantGrid;
