import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-500">
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5L21 21" strokeLinecap="round" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search by title, description, or location..."
        className="w-full bg-[#141414] border border-white/10 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-white/20 transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
