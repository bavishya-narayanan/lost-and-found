import React from 'react';

export default function MatchScoreBadge({ score }) {
  let color = 'text-green-400 border-green-400/20 bg-green-400/10';
  if (score < 75) color = 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
  if (score < 50) color = 'text-red-400 border-red-400/20 bg-red-400/10';

  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border ${color}`}>
      <span className="text-lg font-bold leading-none">{score}%</span>
      <span className="text-[9px] font-medium uppercase tracking-wider mt-0.5 opacity-80">Match</span>
    </div>
  );
}
