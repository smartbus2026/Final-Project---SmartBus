import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { userService } from '../services/userService';
import Api from '../services/Api';

export const useDashboard = () => {
  const [data, setData] = useState({
    totalStudents: 0,
    totalRoutes: 0,
    activeTrips: [],
    loading: true
  });

  const fetchDashboardData = async () => {
    try {
      const [usersRes, routesRes] = await Promise.all([
        Api.get('/users'),
        Api.get('/routes')
      ]);

      setData({
        totalStudents: usersRes.data.length,
        totalRoutes: routesRes.data.data?.length || 0,
        activeTrips: [], 
        loading: false
      });
    } catch (e) {
      console.error(e);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  return data;
};