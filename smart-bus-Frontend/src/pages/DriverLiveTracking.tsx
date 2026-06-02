import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDriverContext } from './DriverLayout';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Ic } from '../icons';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busMarkerIcon = L.divIcon({
  className: 'custom-bus-marker',
  html: `<div style="background-color: #F7A01B; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #1c1c1c; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(247,160,27,0.5);"><span style="font-size: 18px;">🚌</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const MapCenterUpdater: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

export default function DriverLiveTracking() {
  const { t } = useTranslation();
  const { activeTrip, geo } = useDriverContext();

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-app-tx italic">
          {t('live_tracking_part1')}{' '}
          <span className="text-app-am">{t('live_tracking_part2')}</span>
        </h2>
        <div className="h-px bg-app-bd/50 flex-1" />
      </div>

      {activeTrip && geo.lat !== null && geo.lng !== null ? (
        <div className="bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden shadow-xl h-[80vh] relative z-0">
          <MapContainer 
            center={[geo.lat, geo.lng]} 
            zoom={16} 
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            />
            <Marker position={[geo.lat, geo.lng]} icon={busMarkerIcon} />
            <MapCenterUpdater lat={geo.lat} lng={geo.lng} />
          </MapContainer>
        </div>
      ) : activeTrip ? (
        <div className="bg-app-card border border-app-bd rounded-[2.5rem] h-[80vh] flex items-center justify-center shadow-xl">
           <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">
                {t('acquiring_gps_map')}
              </p>
           </div>
        </div>
      ) : (
        <div className="bg-app-card/30 border border-app-bd/50 border-dashed rounded-[2.5rem] h-[80vh] flex flex-col items-center justify-center opacity-70">
          <Ic.Target className="text-app-mu mb-4 opacity-50" size={48} />
          <p className="text-[12px] font-black uppercase tracking-widest text-app-mu text-center">
            {t('live_map_inactive')}
          </p>
          <p className="text-[10px] text-app-mu2 uppercase tracking-widest mt-2">
            {t('start_trip_for_gps')}
          </p>
        </div>
      )}
    </div>
  );
}
