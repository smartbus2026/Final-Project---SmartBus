// src/services/userService.ts
import Api from './Api';

export const userService = {
  getAllUsers: () => Api.get('/users'),
  updateUser: (id: string, data: any) => Api.put(`/users/${id}`, data),
  deleteUser: (id: string) => Api.delete(`/users/${id}`),
};