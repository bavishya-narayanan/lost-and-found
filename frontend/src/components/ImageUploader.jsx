import React, { useState, useEffect } from 'react';

const ImageUploader = ({ onImageSelected, initialImage = null, required = false }) => {
  const [preview, setPreview] = useState(null);

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  useEffect(() => {
    if (initialImage) {
      setPreview(initialImage.startsWith('/') ? `${BACKEND}${initialImage}` : initialImage);
    }
  }, [initialImage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageSelected(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      onImageSelected(null);
      setPreview(initialImage ? (initialImage.startsWith('/') ? `${BACKEND}${initialImage}` : initialImage) : null);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
        Upload Image {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        required={required && !initialImage}
        className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-zinc-300 hover:file:bg-white/20 cursor-pointer"
      />
      {preview && (
        <div className="mt-4 flex justify-center bg-[#0d0d0d] p-4 rounded-xl border border-white/8">
          <img src={preview} alt="Preview" className="h-48 w-auto object-contain rounded-lg shadow-sm" />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
