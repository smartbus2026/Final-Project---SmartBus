import Api from './Api';

export const adminService = {
  getDashboardStats: () => Api.get('/admin/dashboard-stats'),
  getActiveTrips: () => Api.get('/admin/active-trips'),
};