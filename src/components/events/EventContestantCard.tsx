import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface Contestant {
  id: string;
  name: string;
  department: string | null;
  profile_image: string | null;
  cover_image: string | null; // ← magazine cover (primary display image)
  total_votes: number;
  slug: string | null;
}

interface Props {
  contestant: Contestant;
  eventId: string;
  isLive: boolean;
  onVote: (contestant: Contestant) => void;
}

const EventContestantCard = ({ contestant, eventId, isLive, onVote }: Props) => {
  // Cover image is the main display (magazine cover).
  // Fall back to profile image if cover not available.
  const cardImage = contestant.cover_image || contestant.profile_image;

  return (
    <Card className="group overflow-hidden hover:shadow-card transition-all duration-300">
      <div className="relative">
        <Link to={`/events-hub/${eventId}/contestant/${contestant.slug || contestant.id}`}>
          {cardImage ? (
            <img
              src={cardImage}
              alt={contestant.name}
              className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground/30">
                {contestant.name.charAt(0)}
              </span>
            </div>
          )}
        </Link>

        {/* Vote count badge */}
        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground rounded-full px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
          {contestant.total_votes.toLocaleString()} votes
        </div>

        {/* Profile picture overlay (bottom-left corner) — only when both images exist */}
        {contestant.profile_image && contestant.cover_image && (
          <div className="absolute bottom-2 left-2">
            <img
              src={contestant.profile_image}
              alt={`${contestant.name} profile`}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
              loading="lazy"
            />
          </div>
        )}
      </div>

      <CardContent className="p-3 md:p-4">
        <Link to={`/events-hub/${eventId}/contestant/${contestant.slug || contestant.id}`}>
          <h3 className="font-heading font-bold text-sm md:text-lg text-foreground truncate hover:text-primary transition-colors">
            {contestant.name}
          </h3>
        </Link>
        {contestant.department && (
          <p className="text-xs text-muted-foreground truncate">{contestant.department}</p>
        )}
        <Button
          className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90 text-sm h-9 md:h-10"
          onClick={() => onVote(contestant)}
          disabled={!isLive}
        >
          <Heart className="h-4 w-4 mr-1" />
          {isLive ? "Vote" : "Ended"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EventContestantCard;
