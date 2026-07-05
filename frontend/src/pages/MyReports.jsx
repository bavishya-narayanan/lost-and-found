import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getMyLostItems, getMyFoundItems, deleteLostItem, deleteFoundItem, updateLostItem, updateFoundItem } from '../services/itemService';
import ReportCard from '../components/ReportCard';
import ItemForm from '../components/ItemForm';
import DashboardLayout from '../components/layout/DashboardLayout';
import ReportDetailsModal from '../components/ReportDetailsModal';

export default function MyReports() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('lost');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit State
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
    if (location.hash === '#found') {
      setActiveTab('found');
    } else {
      setActiveTab('lost');
    }
  }, [location.hash]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lostRes, foundRes] = await Promise.all([
        getMyLostItems(),
        getMyFoundItems()
      ]);
      setLostItems(lostRes);
      setFoundItems(foundRes);
    } catch (err) {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      if (activeTab === 'lost') {
        await deleteLostItem(id);
        setLostItems(prev => prev.filter(item => item._id !== id));
      } else {
        await deleteFoundItem(id);
        setFoundItems(prev => prev.filter(item => item._id !== id));
      }
    } catch (err) {
      alert('Failed to delete report.');
    }
  };

  const handleEditSubmit = async (formData, imageFile) => {
    setIsUpdating(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('description', formData.description);
      
      if (activeTab === 'lost') {
        data.append('dateLost', formData.date);
        data.append('locationLost', formData.location);
      } else {
        data.append('dateFound', formData.date);
        data.append('locationFound', formData.location);
        data.append('custodyType', formData.custodyType);
        if (formData.custodyType === 'deposited') {
          data.append('currentLocation', formData.currentLocation);
          data.append('landmark', formData.landmark);
        }
      }
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (activeTab === 'lost') {
        const updated = await updateLostItem(editingItem._id, data);
        setLostItems(prev => prev.map(item => item._id === updated._id ? updated : item));
      } else {
        const updated = await updateFoundItem(editingItem._id, data);
        setFoundItems(prev => prev.map(item => item._id === updated._id ? updated : item));
      }
      setEditingItem(null);
    } catch (err) {
      alert('Failed to update report.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-zinc-400">Loading reports...</div>;

  const currentItems = activeTab === 'lost' ? lostItems : foundItems;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Reports</h1>
            <p className="text-zinc-400 mt-2">Manage items you have reported as lost or found.</p>
          </div>
        </div>

      {error && <div className="text-red-400 mb-6">{error}</div>}

      <div className="flex border-b border-white/10 mb-8">
        <button
          className={`pb-4 px-6 text-sm font-medium transition-colors border-b-2 ${activeTab === 'lost' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          onClick={() => setActiveTab('lost')}
        >
          Lost Items ({lostItems.length})
        </button>
        <button
          className={`pb-4 px-6 text-sm font-medium transition-colors border-b-2 ${activeTab === 'found' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          onClick={() => setActiveTab('found')}
        >
          Found Items ({foundItems.length})
        </button>
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <p className="text-zinc-400">No {activeTab} reports found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map(item => (
            <ReportCard
              key={item._id}
              report={item}
              type={activeTab}
              onView={setViewingItem}
              onEdit={setEditingItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* View Modal */}
      {viewingItem && (
        <ReportDetailsModal 
          report={viewingItem} 
          type={activeTab} 
          onClose={() => setViewingItem(null)} 
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0d0d0d] rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl my-8 relative">
            <div className="sticky top-0 bg-[#0d0d0d]/80 backdrop-blur-xl p-4 border-b border-white/10 flex justify-between items-center rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-white">Edit {activeTab === 'lost' ? 'Lost' : 'Found'} Item</h2>
              <button onClick={() => setEditingItem(null)} className="text-zinc-400 hover:text-white p-2">✕</button>
            </div>
            <div className="p-6">
              <ItemForm 
                type={activeTab} 
                initialData={editingItem} 
                onSubmit={handleEditSubmit} 
                isLoading={isUpdating} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
