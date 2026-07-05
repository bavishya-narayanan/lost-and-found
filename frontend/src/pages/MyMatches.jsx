import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import MatchCard from '../components/MatchCard';
import { getMyMatches } from '../services/matchService';

export default function MyMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const data = await getMyMatches();
      setMatches(data);
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">My Matches</h1>
          <p className="text-zinc-400 mt-2">Potential matches found for your reported items.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-zinc-400">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <p className="text-zinc-400">No matches found for your items yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match) => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
