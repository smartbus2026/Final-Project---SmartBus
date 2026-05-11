"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateEtaMinutes = exports.calculateDistanceKm = void 0;
const EARTH_RADIUS_KM = 6371;
const toRad = (degree) => (degree * Math.PI) / 180;
const calculateDistanceKm = (pointA, pointB) => {
    const latDistance = toRad(pointB.lat - pointA.lat);
    const lngDistance = toRad(pointB.lng - pointA.lng);
    const a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
        Math.cos(toRad(pointA.lat)) *
            Math.cos(toRad(pointB.lat)) *
            Math.sin(lngDistance / 2) *
            Math.sin(lngDistance / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
};
exports.calculateDistanceKm = calculateDistanceKm;
const estimateEtaMinutes = (distanceKm, speedKmh) => {
    if (!speedKmh || speedKmh <= 0) {
        return undefined;
    }
    return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
};
exports.estimateEtaMinutes = estimateEtaMinutes;
