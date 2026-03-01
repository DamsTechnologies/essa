import { Trophy, Crown, Medal } from "lucide-react";
import type { Contestant } from "@/pages/FashionContest";

interface Props {
  contestants: Contestant[];
  loading: boolean;
}

const ContestLeaderboard = ({ contestants, loading }: Props) => {
  const top3 = contestants.slice(0, 3);

  if (loading || top3.length === 0) {
    return (
      <section className="py-8 bg-muted/30">
        <div className="container max-w-screen-xl px-4">
          <div className="text-center text-muted-foreground py-8">
            {loading ? "Loading leaderboard..." : "No contestants yet. Stay tuned!"}
          </div>
        </div>
      </section>
    );
  }

  const rankIcons = [
    <Crown className="h-6 w-6 text-accent" />,
    <Medal className="h-5 w-5 text-muted-foreground" />,
    <Medal className="h-5 w-5 text-accent/70" />,
  ];

  const rankColors = [
    "border-accent bg-accent/5 shadow-glow",
    "border-border bg-muted",
    "border-border bg-muted/50",
  ];

  return (
    <section className="py-8 -mt-8 relative z-10">
      <div className="container max-w-screen-xl px-4">
        <div className="bg-card rounded-2xl shadow-premium p-4 md:p-6 border border-border">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Trophy className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-heading font-bold text-primary">Live Leaderboard</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {top3.map((contestant, index) => {
              const displayImage = contestant.profile_image || contestant.cover_image;
              return (
                <div
                  key={contestant.id}
                  className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 transition-all duration-300 ${rankColors[index]}`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={displayImage}
                      alt={contestant.name}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-border"
                      loading="lazy"
                    />
                    <div className="absolute -top-2 -right-2 bg-card rounded-full p-1 shadow-sm border border-border">
                      {rankIcons[index]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <p className="font-semibold text-foreground truncate text-sm md:text-base">{contestant.name}</p>
                    <p className="text-xl md:text-2xl font-bold text-accent">
                      {contestant.total_votes.toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground ml-1">votes</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContestLeaderboard;
