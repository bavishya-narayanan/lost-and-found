import api from './api';

export const searchReports = async (params) => {
  const response = await api.get('/search', { params });
  return response.data;
};
