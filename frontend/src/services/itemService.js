import api from './api';

// --- Lost Items ---

export const getLostItems = async () => {
  const response = await api.get('/lost-items');
  return response.data;
};

export const getMyLostItems = async () => {
  const response = await api.get('/lost-items/my-reports');
  return response.data;
};

export const getLostItemById = async (id) => {
  const response = await api.get(`/lost-items/${id}`);
  return response.data;
};

export const createLostItem = async (formData) => {
  const response = await api.post('/lost-items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateLostItem = async (id, formData) => {
  const response = await api.put(`/lost-items/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteLostItem = async (id) => {
  const response = await api.delete(`/lost-items/${id}`);
  return response.data;
};

// --- Found Items ---

export const getFoundItems = async () => {
  const response = await api.get('/found-items');
  return response.data;
};

export const getMyFoundItems = async () => {
  const response = await api.get('/found-items/my-reports');
  return response.data;
};

export const getFoundItemById = async (id) => {
  const response = await api.get(`/found-items/${id}`);
  return response.data;
};

export const createFoundItem = async (formData) => {
  const response = await api.post('/found-items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateFoundItem = async (id, formData) => {
  const response = await api.put(`/found-items/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteFoundItem = async (id) => {
  const response = await api.delete(`/found-items/${id}`);
  return response.data;
};
