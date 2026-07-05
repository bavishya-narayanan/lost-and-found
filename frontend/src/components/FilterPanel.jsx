import React from 'react';

export default function FilterPanel({ filters, onFilterChange }) {
  const handleChange = (e) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <select
        name="type"
        value={filters.type || ''}
        onChange={handleChange}
        className="bg-[#141414] border border-white/10 text-sm text-zinc-300 rounded-lg py-2 px-3 focus:outline-none focus:border-white/20"
      >
        <option value="">All Types</option>
        <option value="lost">Lost</option>
        <option value="found">Found</option>
      </select>
      
      <select
        name="category"
        value={filters.category || ''}
        onChange={handleChange}
        className="bg-[#141414] border border-white/10 text-sm text-zinc-300 rounded-lg py-2 px-3 focus:outline-none focus:border-white/20"
      >
        <option value="">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Documents">Documents</option>
        <option value="Clothing">Clothing</option>
        <option value="Keys">Keys</option>
        <option value="Other">Other</option>
      </select>

      <select
        name="status"
        value={filters.status || ''}
        onChange={handleChange}
        className="bg-[#141414] border border-white/10 text-sm text-zinc-300 rounded-lg py-2 px-3 focus:outline-none focus:border-white/20"
      >
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Resolved">Resolved</option>
      </select>
    </div>
  );
}
