import React from 'react';
import { useNavigate } from 'react-router-dom';
import MatchScoreBadge from './MatchScoreBadge';

export default function MatchCard({ match }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group flex flex-col md:flex-row items-center gap-6">
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-4 w-full">
        <div className="border border-white/5 rounded-xl p-3 bg-white/5">
          <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider mb-1 block">Lost Item</span>
          <p className="text-white text-sm font-medium truncate">{match.lostItem?.title}</p>
          <p className="text-xs text-zinc-500 truncate">{match.lostItem?.category}</p>
        </div>
        <div className="border border-white/5 rounded-xl p-3 bg-white/5">
          <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider mb-1 block">Found Item</span>
          <p className="text-white text-sm font-medium truncate">{match.foundItem?.title}</p>
          <p className="text-xs text-zinc-500 truncate">{match.foundItem?.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
        <MatchScoreBadge score={match.score} />
        <button 
          onClick={() => navigate(`/dashboard/matches/${match._id}`)}
          className="bg-white/10 hover:bg-white text-white hover:text-black text-xs font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
