import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * CompetitionRedirect
 *
 * Replaces the old /competition page.
 * Looks up the migrated event by its stable slug and redirects
 * to /events-hub/{id}, preserving any ?payment=success query param.
 */
const CompetitionRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id")
        .eq("slug", "fashion-magazine-contest")
        .single();

      if (error || !data) {
        console.error("Could not find competition event:", error);
        setError(true);
        // Fallback: go to events hub
        setTimeout(() => navigate("/events-hub", { replace: true }), 2000);
        return;
      }

      // Preserve ?payment=success so the verify-payment flow still works
      const paymentParam = searchParams.get("payment");
      const destination = paymentParam
        ? `/events-hub/${data.id}?payment=${paymentParam}`
        : `/events-hub/${data.id}`;

      navigate(destination, { replace: true });
    };

    redirect();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">
          {error
            ? "Redirecting to Events Hub..."
            : "Loading the Fashion Magazine Contest..."}
        </p>
      </div>
    </div>
  );
};

export default CompetitionRedirect;
