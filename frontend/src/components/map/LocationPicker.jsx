import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
    html: '<div style="width:22px;height:22px;background:#E5402A;border:3px solid #FAF9F6;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>',
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 22]
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // India

/**
 * Small map where the reporter clicks (or drags the pin) to set the location.
 * value: [lng, lat] | []   onChange([lng, lat])
 */
const LocationPicker = ({ value, onChange, height = 260 }) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (mapRef.current || !containerRef.current) return undefined;

        const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        map.on('click', (e) => {
            onChangeRef.current([Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))]);
        });

        mapRef.current = map;
        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Sync marker with value
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (!value || value.length !== 2) {
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            return;
        }
        const latLng = [value[1], value[0]];
        if (!markerRef.current) {
            markerRef.current = L.marker(latLng, { icon: pinIcon, draggable: true }).addTo(map);
            markerRef.current.on('dragend', (e) => {
                const { lat, lng } = e.target.getLatLng();
                onChangeRef.current([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
            });
            map.setView(latLng, Math.max(map.getZoom(), 15));
        } else {
            markerRef.current.setLatLng(latLng);
            if (!map.getBounds().contains(latLng)) map.setView(latLng, map.getZoom());
        }
    }, [value]);

    return (
        <div
            ref={containerRef}
            style={{ height }}
            className="z-0 w-full overflow-hidden rounded-2xl ring-1 ring-line"
            aria-label="Click the map to set the incident location"
        />
    );
};

export default LocationPicker;
