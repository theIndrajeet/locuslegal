import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FeatureVote {
  id: string;
  feature_key: string;
}

export function useFeatureVotes() {
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<FeatureVote[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const countsInFlight = useRef(false);
  const userVotesInFlight = useRef(false);

  // Fetch aggregate vote counts via RPC (no user data exposed)
  const fetchCounts = useCallback(async () => {
    if (countsInFlight.current) return;
    countsInFlight.current = true;
    try {
      const { data, error } = await supabase.rpc("get_feature_vote_counts");
      if (error) return;
      if (data) {
        const counts: Record<string, number> = {};
        (data as { feature_key: string; vote_count: number }[]).forEach((row) => {
          counts[row.feature_key] = row.vote_count;
        });
        setVoteCounts(counts);
      }
    } catch {
      // swallow — avoid retry storms
    } finally {
      countsInFlight.current = false;
    }
  }, []);

  // Fetch user's votes
  const fetchUserVotes = useCallback(async () => {
    if (!userId) { setUserVotes([]); return; }
    if (userVotesInFlight.current) return;
    userVotesInFlight.current = true;
    try {
      const { data, error } = await supabase
        .from("feature_votes")
        .select("id, feature_key")
        .eq("user_id", userId);
      if (error) return;
      if (data) setUserVotes(data);
    } catch {
      // swallow
    } finally {
      userVotesInFlight.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetchCounts().then(() => setLoading(false));
  }, [fetchCounts]);

  useEffect(() => {
    fetchUserVotes();
  }, [fetchUserVotes]);

  const hasVoted = useCallback(
    (featureKey: string) => userVotes.some((v) => v.feature_key === featureKey),
    [userVotes]
  );

  const toggleVote = useCallback(
    async (featureKey: string) => {
      if (!userId) {
        navigate("/auth");
        return;
      }
      const existing = userVotes.find((v) => v.feature_key === featureKey);
      if (existing) {
        await supabase.from("feature_votes").delete().eq("id", existing.id);
        setUserVotes((prev) => prev.filter((v) => v.id !== existing.id));
        setVoteCounts((prev) => ({
          ...prev,
          [featureKey]: Math.max(0, (prev[featureKey] || 1) - 1),
        }));
      } else {
        const { data } = await supabase
          .from("feature_votes")
          .insert({ user_id: userId, feature_key: featureKey })
          .select("id, feature_key")
          .single();
        if (data) {
          setUserVotes((prev) => [...prev, data]);
          setVoteCounts((prev) => ({
            ...prev,
            [featureKey]: (prev[featureKey] || 0) + 1,
          }));
        }
      }
    },
    [userId, userVotes, navigate]
  );

  return { voteCounts, hasVoted, toggleVote, loading };
}
