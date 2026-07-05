import api from './api';

const chatService = {
  getMessages: async (sessionId) => {
    const response = await api.get(`/chat/messages/${sessionId}`);
    return response.data;
  }
};

export default chatService;
