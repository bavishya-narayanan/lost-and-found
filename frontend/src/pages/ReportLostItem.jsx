import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemForm from '../components/ItemForm';
import { createLostItem } from '../services/itemService';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function ReportLostItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData, imageFile) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('dateLost', formData.date);
      data.append('locationLost', formData.location);
      if (imageFile) {
        data.append('image', imageFile);
      }

      await createLostItem(data);
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Report Lost Item</h1>
          <p className="text-zinc-400 mt-2">Provide details about the item you lost so the community can help you find it.</p>
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

        <ItemForm type="lost" onSubmit={handleSubmit} isLoading={loading} />
      </div>
    </DashboardLayout>
  );
}
