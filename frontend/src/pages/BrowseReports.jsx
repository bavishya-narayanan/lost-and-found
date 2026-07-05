import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ReportCard from '../components/ReportCard';
import ReportDetailsModal from '../components/ReportDetailsModal';
import { searchReports } from '../services/searchService';

export default function BrowseReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ type: '', category: '', status: '' });
  const [viewingItem, setViewingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, [searchQuery, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await searchReports({ query: searchQuery, ...filters });
      setReports(data);
    } catch (err) {
      console.error('Failed to search reports', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Browse Reports</h1>
          <p className="text-zinc-400 mt-2">Search and filter through all lost and found items on campus.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterPanel filters={filters} onFilterChange={setFilters} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-zinc-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <p className="text-zinc-400">No reports found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                type={report.type}
                onView={setViewingItem}
                readOnly={true}
              />
            ))}
          </div>
        )}

        {/* View Modal */}
        {viewingItem && (
          <ReportDetailsModal 
            report={viewingItem} 
            type={viewingItem.type} 
            onClose={() => setViewingItem(null)} 
          />
        )}
      </div>
    </DashboardLayout>
  );
}
