import React, { useState, useEffect } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import ImageUploader from './ImageUploader';
import CampusMap from './CampusMap';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

const categories = ['Electronics', 'Clothing', 'Accessories', 'Documents', 'Books', 'Other'];

export default function ItemForm({ type, initialData, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0],
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    custodyType: 'holding',
    landmark: '',
    latitude: '',
    longitude: '',
    selectedBy: 'MAP'
  });

  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || categories[0],
        description: initialData.description || '',
        date: initialData[type === 'lost' ? 'dateLost' : 'dateFound']
          ? new Date(initialData[type === 'lost' ? 'dateLost' : 'dateFound']).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        location: initialData[type === 'lost' ? 'locationLost' : 'locationFound'] || '',
        custodyType: initialData.custodyType || 'holding',
        landmark: initialData.location?.landmark || initialData.landmark || '',
        latitude: initialData.location?.latitude || '',
        longitude: initialData.location?.longitude || '',
        selectedBy: initialData.location?.selectedBy || 'MAP'
      });
    }
  }, [initialData, type]);

  const { location: gpsLocation, loading: gpsLoading, error: gpsError, requestLocation } = useCurrentLocation();

  useEffect(() => {
    if (gpsLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        selectedBy: 'GPS'
      }));
    }
  }, [gpsLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, imageFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-[#0d0d0d] p-6 rounded-2xl border border-white/8 shadow-xl">
      <Input
        label="Title"
        id="title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="E.g., Blue iPhone 13"
        required
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-300">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
          required
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-300">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          placeholder="Provide detailed description, distinguishing marks, etc."
          className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          type="date"
          label={type === 'lost' ? 'Date Lost' : 'Date Found'}
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        <Input
          label={type === 'lost' ? 'Location Lost' : 'Location Found'}
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="E.g., Library, Cafeteria"
          required
        />
      </div>

      {type === 'found' && (
        <div className="bg-[#111111]/50 p-4 rounded-xl border border-white/5 space-y-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Current Holder Status</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 hover:text-zinc-300">
              <input
                type="radio"
                name="custodyType"
                value="holding"
                checked={formData.custodyType === 'holding'}
                onChange={handleChange}
                className="accent-white"
              />
              I am holding the item
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 hover:text-zinc-300">
              <input
                type="radio"
                name="custodyType"
                value="deposited"
                checked={formData.custodyType === 'deposited'}
                onChange={handleChange}
                className="accent-white"
              />
              I deposited the item
            </label>
          </div>

          {formData.custodyType === 'deposited' && (
            <div className="space-y-4 mt-4 pt-4 border-t border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <label className="block text-sm font-medium text-zinc-300">Deposit Location</label>
                <button 
                  type="button" 
                  onClick={requestLocation}
                  disabled={gpsLoading}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  📍 {gpsLoading ? 'Getting Location...' : 'Use Current Location'}
                </button>
              </div>
              
              {gpsError && <p className="text-red-400 text-xs">{gpsError}</p>}

              <div className="h-[300px] w-full mb-4">
                <CampusMap 
                  mode="select" 
                  value={{ latitude: formData.latitude, longitude: formData.longitude }}
                  onLocationChange={({ latitude, longitude }) => {
                    setFormData(prev => ({ ...prev, latitude, longitude, selectedBy: 'MAP' }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Landmark (e.g., Security Desk)"
                  id="landmark"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}
        </div>
      )}

      <ImageUploader
        onImageSelected={setImageFile}
        initialImage={initialData?.image}
        required={type === 'found'}
      />

      <div className="pt-4 border-t border-white/10 flex justify-end">
        <Button variant="primary" type="submit" loading={isLoading}>
          {initialData ? 'Update Report' : 'Submit Report'}
        </Button>
      </div>
    </form>
  );
}
