import api from "./Api";

export type StopData = {
  _id: string;
  name: string;
  location: { lat: number; lng: number };
};

export type BusData = {
  _id: string;
  busCode: string;
  driverName: string;
  speedKmh: number;
  etaMinutes?: number;
  currentLocation: { lat: number; lng: number };
  route: { _id: string; name: string; stops: StopData[] };
  currentStop?: StopData;
  nextStop?: StopData;
};

export const getActiveBuses = async (): Promise<BusData[]> => {
  const res = await api.get("/tracking/buses");
  return res.data?.data ?? [];
};

export const getRouteTracking = async (
  routeId: string
): Promise<{ stops: StopData[] }> => {
  const res = await api.get(`/tracking/routes/${routeId}`);
  return { stops: res.data?.data?.route?.stops ?? [] };
};
