import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemForm from '../components/ItemForm';
import { createFoundItem } from '../services/itemService';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function ReportFoundItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData, imageFile) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!imageFile) {
      setError('An image is required for found items.');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('dateFound', formData.date);
      data.append('locationFound', formData.location);
      data.append('custodyType', formData.custodyType);
      
      if (formData.custodyType === 'deposited') {
        data.append('latitude', formData.latitude);
        data.append('longitude', formData.longitude);
        data.append('landmark', formData.landmark);
        data.append('selectedBy', formData.selectedBy || 'MAP');
      }
      
      data.append('image', imageFile);

      await createFoundItem(data);
      setSuccess(true);
      setTimeout(() => navigate('/my-reports'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Report Found Item</h1>
          <p className="text-zinc-400 mt-2">Help reunite someone with their lost belonging by providing detailed information.</p>
        </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium text-center">
          Report submitted successfully! Redirecting...
        </div>
      )}

        <ItemForm type="found" onSubmit={handleSubmit} isLoading={loading} />
      </div>
    </DashboardLayout>
  );
}
