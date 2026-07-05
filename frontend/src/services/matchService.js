import api from './api';

export const getMyMatches = async () => {
  const response = await api.get('/matches/my-matches');
  return response.data;
};

export const getMatchDetails = async (id) => {
  const response = await api.get(`/matches/${id}`);
  return response.data;
};
