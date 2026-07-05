import api from './api';

const recoveryService = {
  startRecovery: async (matchId) => {
    const response = await api.post(`/recovery/start/${matchId}`);
    return response.data;
  },
  
  acceptContact: async (sessionId) => {
    const response = await api.post(`/recovery/accept-contact/${sessionId}`);
    return response.data;
  },

  getVerificationQuestions: async (sessionId) => {
    const response = await api.get(`/recovery/verification-questions/${sessionId}`);
    return response.data;
  },

  submitVerification: async (sessionId, answers) => {
    const response = await api.post(`/recovery/submit-verification/${sessionId}`, { answers });
    return response.data;
  },

  approveVerification: async (sessionId) => {
    const response = await api.post(`/recovery/approve-verification/${sessionId}`);
    return response.data;
  },

  completeRecovery: async (sessionId) => {
    const response = await api.post(`/recovery/complete/${sessionId}`);
    return response.data;
  },

  getSession: async (matchId) => {
    const response = await api.get(`/recovery/session/${matchId}`);
    return response.data;
  }
};

export default recoveryService;
