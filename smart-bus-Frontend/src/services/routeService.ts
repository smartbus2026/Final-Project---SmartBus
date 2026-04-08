// src/services/routeService.ts
import Api from './Api';

export const routeService = {
  getAll: async () => {
    const response = await Api.get('/routes');
    return response.data.data || [];
  },

  create: async (payload: { name: string; distance: string; duration: string; stops: string[] }) => {
    const response = await Api.post('/routes', payload);
    return response.data;
  },

  delete: async (id: string) => {
    return await Api.delete(`/routes/${id}`);
  }
};