// src/hooks/useRoutes.ts
import { useState, useEffect } from 'react';
import { routeService } from '../services/routeService';

export interface BusRoute {
  id: string;
  code: string;
  name: string;
  distance: string;
  duration: string;
  activeBuses: number;
  stops: string[];
}

export const useRoutes = () => {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoutes = async () => {
    try {
      const data = await routeService.getAll();
      const mapped = data.map((r: any, index: number) => ({
        id: r._id,
        code: `R-${String(index + 1).padStart(3, '0')}`,
        name: r.name,
        distance: r.distance || '—',
        duration: r.duration || '—',
        activeBuses: 0,
        stops: r.stops ? r.stops.map((s: any) => s.name || s) : [],
      }));
      setRoutes(mapped);
      return mapped;
    } catch (error) {
      console.error("Failed to fetch routes", error);
      return [];
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const addRoute = async (formData: { name: string; distance: string; duration: string; stops: string[] }) => {
    setIsLoading(true);
    try {
      await routeService.create(formData);
      await fetchRoutes();
      return true;
    } catch (error) {
      console.error("Error adding route", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeRoute = async (id: string) => {
    try {
      await routeService.delete(id);
      setRoutes(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (error) {
      console.error("Error removing route", error);
      return false;
    }
  };

  return { routes, isLoading, addRoute, removeRoute, refresh: fetchRoutes };
};