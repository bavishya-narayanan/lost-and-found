import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import MatchScoreBadge from '../components/MatchScoreBadge';
import SimilarityBreakdown from '../components/SimilarityBreakdown';
import { getMatchDetails } from '../services/matchService';
import CampusMap from '../components/CampusMap';
import { generateGoogleNavigation } from '../utils/mapUtils';

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const data = await getMatchDetails(id);
        setMatch(data);
      } catch (err) {
        console.error('Failed to load match details', err);
        // Might redirect if unauthorized or 404
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  if (loading) return <DashboardLayout><div className="flex justify-center py-20 text-zinc-400">Loading match details...</div></DashboardLayout>;
  if (!match) return <DashboardLayout><div className="flex justify-center py-20 text-zinc-400">Match not found.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-12 px-6">
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white text-sm font-medium mb-6 flex items-center gap-2">
          ← Back
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-1 bg-[#141414] border border-white/10 rounded-2xl p-6">
            <span className="text-xs uppercase font-bold text-red-400 tracking-wider mb-4 block">Lost Item</span>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 mb-4">
              {match.lostItem.image ? (
                <img src={match.lostItem.image.startsWith('http') ? match.lostItem.image : `${BACKEND}${match.lostItem.image}`} alt={match.lostItem.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">No Image</div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{match.lostItem.title}</h2>
            <p className="text-sm text-zinc-400 mb-4">{match.lostItem.description}</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-zinc-500">Category:</span> <span className="text-zinc-200">{match.lostItem.category}</span></p>
              <p><span className="text-zinc-500">Location:</span> <span className="text-zinc-200">{match.lostItem.locationLost}</span></p>
              <p><span className="text-zinc-500">Date:</span> <span className="text-zinc-200">{new Date(match.lostItem.dateLost).toLocaleDateString()}</span></p>
            </div>
          </div>

          <div className="flex-1 bg-[#141414] border border-white/10 rounded-2xl p-6">
            <span className="text-xs uppercase font-bold text-green-400 tracking-wider mb-4 block">Found Item</span>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 mb-4">
              {match.foundItem.image ? (
                <img src={match.foundItem.image.startsWith('http') ? match.foundItem.image : `${BACKEND}${match.foundItem.image}`} alt={match.foundItem.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">No Image</div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{match.foundItem.title}</h2>
            <p className="text-sm text-zinc-400 mb-4">{match.foundItem.description}</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-zinc-500">Category:</span> <span className="text-zinc-200">{match.foundItem.category}</span></p>
              <p><span className="text-zinc-500">Location:</span> <span className="text-zinc-200">{match.foundItem.locationFound}</span></p>
              <p><span className="text-zinc-500">Date:</span> <span className="text-zinc-200">{new Date(match.foundItem.dateFound).toLocaleDateString()}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center mb-8">
          <div className="flex flex-col items-center flex-shrink-0 text-center md:border-r border-white/10 md:pr-8">
            <h3 className="text-white font-semibold mb-4">Overall Match</h3>
            <div className="scale-150 transform mb-2">
              <MatchScoreBadge score={match.score} />
            </div>
            {(() => {
              const confidence = match.analytics?.similarityBreakdown?.confidenceLevel || 
                (match.score >= 95 ? 'Very High' : (match.score >= 90 ? 'High' : (match.score >= 80 ? 'Medium' : 'Low')));
              
              const colors = {
                'Very High': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                'High': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                'Low': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }[confidence] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

              return (
                <div className={`mt-6 px-3 py-1.5 rounded-full text-xs font-semibold border ${colors}`}>
                  Confidence: {confidence}
                </div>
              );
            })()}
            <p className="text-xs text-zinc-500 mt-4 max-w-[200px]">
              This score indicates the likelihood that these two items are the same based on our matching algorithm.
            </p>
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-white font-semibold mb-4">Similarity Breakdown</h3>
            <SimilarityBreakdown breakdown={match.breakdown} analytics={match.analytics} />
          </div>
        </div>

        {/* Deposited Location Map */}
        {match.foundItem?.custodyType === 'deposited' && match.foundItem?.location && (
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span>📍</span> Deposited Location
              </h3>
              {match.foundItem.location.latitude && match.foundItem.location.longitude && (
                <a
                  href={generateGoogleNavigation(match.foundItem.location.latitude, match.foundItem.location.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-white/10 hover:bg-white text-white hover:text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  🗺️ Navigate using Google Maps
                </a>
              )}
            </div>
            <div className="flex gap-4 mb-4">
              <div className="bg-black/30 rounded-xl p-4 flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Campus Zone</p>
                <p className="text-white font-medium">{match.foundItem.location.campusZone || '—'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Landmark</p>
                <p className="text-white font-medium">{match.foundItem.location.landmark || '—'}</p>
              </div>
            </div>
            {match.foundItem.location.latitude && match.foundItem.location.longitude && (
              <div className="h-[280px] w-full">
                <CampusMap
                  mode="view"
                  value={match.foundItem.location}
                />
              </div>
            )}
            {!match.foundItem.location.latitude && (
              <p className="text-xs text-zinc-500">📍 {match.foundItem.location.campusZone || 'Campus Location'}</p>
            )}
          </div>
        )}

        {/* Start Recovery CTA */}
        <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold mb-1">Is this your item?</h3>
            <p className="text-sm text-zinc-400">Start the recovery process to contact the finder and claim your item.</p>
          </div>
          <button
            id="start-recovery-btn"
            onClick={() => navigate(`/dashboard/recovery/${id}`)}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
              <path d="M10 8l6 4-6 4V8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Start Recovery
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
