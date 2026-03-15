import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Vote, DollarSign, Users, Trophy, TrendingUp } from "lucide-react";

interface Props {
  eventId: string;
  eventTitle: string;
  votingType: string;
}

interface AnalyticsData {
  totalVotes: number;
  totalRevenue: number;
  totalStudents: number;
  topContestants: { name: string; total_votes: number; profile_image: string | null }[];
  recentPayments: { email: string; amount: number; votes_purchased: number; created_at: string; voter_name: string | null }[];
}

const EventAnalytics = ({ eventId, eventTitle, votingType }: Props) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const [contestantsRes, paymentsRes, studentsRes] = await Promise.all([
        supabase.from("event_contestants").select("name, total_votes, profile_image")
          .eq("event_id", eventId).order("total_votes", { ascending: false }).limit(10),
        votingType === "monetary"
          ? supabase.from("event_payments").select("email, amount, votes_purchased, created_at, voter_name")
              .eq("event_id", eventId).eq("payment_status", "verified").order("created_at", { ascending: false }).limit(50)
          : Promise.resolve({ data: [] }),
        votingType === "free"
          ? supabase.from("event_votes").select("student_id").eq("event_id", eventId)
          : Promise.resolve({ data: [] }),
      ]);

      const contestants = contestantsRes.data || [];
      const payments = (paymentsRes.data || []) as any[];
      const votes = (studentsRes.data || []) as any[];

      const totalVotes = contestants.reduce((sum: number, c: any) => sum + c.total_votes, 0);
      const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const uniqueStudents = new Set(votes.map((v: any) => v.student_id)).size;

      setData({
        totalVotes,
        totalRevenue,
        totalStudents: uniqueStudents,
        topContestants: contestants,
        recentPayments: payments,
      });
      setLoading(false);
    };
    fetchAnalytics();
  }, [eventId, votingType]);

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h3 className="font-heading font-bold text-xl text-foreground">Analytics — {eventTitle}</h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-accent/10 p-3 rounded-full"><Vote className="h-5 w-5 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Total Votes</p><p className="text-2xl font-bold">{data.totalVotes.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        {votingType === "monetary" && (
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-green-100 p-3 rounded-full"><DollarSign className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">₦{data.totalRevenue.toLocaleString()}</p></div>
            </CardContent>
          </Card>
        )}
        {votingType === "free" && (
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-primary/10 p-3 rounded-full"><Users className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Voters</p><p className="text-2xl font-bold">{data.totalStudents.toLocaleString()}</p></div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="bg-accent/10 p-3 rounded-full"><Trophy className="h-5 w-5 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Contestants</p><p className="text-2xl font-bold">{data.topContestants.length}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Top Contestants */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Leaderboard</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Contestant</TableHead>
                <TableHead>Votes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topContestants.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className={`font-bold ${i === 0 ? "text-accent" : ""}`}>#{i + 1}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {c.profile_image ? (
                      <img src={c.profile_image} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{c.name.charAt(0)}</div>
                    )}
                    {c.name}
                  </TableCell>
                  <TableCell className="font-bold">{c.total_votes.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Payments (monetary only) */}
      {votingType === "monetary" && data.recentPayments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Recent Payments</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Voter</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Votes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentPayments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{p.voter_name || p.email}</TableCell>
                      <TableCell>₦{p.amount.toLocaleString()}</TableCell>
                      <TableCell>{p.votes_purchased}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventAnalytics;
