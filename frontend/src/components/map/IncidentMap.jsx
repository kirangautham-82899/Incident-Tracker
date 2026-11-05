import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import IncidentDetailModal from '../incident/IncidentDetailModal';
import { TYPE_COLORS, STATUS_LABELS } from '../../utils/constants';
import { escapeHtml } from '../../utils/helpers';

const markerIcon = (type, severity, status) => {
    const color = TYPE_COLORS[type] || '#6b7280';
    const size = severity === 'critical' ? 34 : severity === 'high' ? 30 : 26;
    const closed = status === 'resolved' || status === 'false';
    return L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};opacity:${closed ? 0.45 : 1};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><div style="width:${size * 0.35}px;height:${size * 0.35}px;background:white;border-radius:50%"></div></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size]
    });
};

const clusterIcon = (cluster) => {
    const count = cluster.getChildCount();
    const size = count > 20 ? 48 : count > 5 ? 42 : 36;
    return L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.3)">${count}</div>`,
        className: '',
        iconSize: L.point(size, size)
    });
};

const validCoords = (inc) => {
    const c = inc.location?.coordinates;
    return Array.isArray(c) && c.length === 2 && Number.isFinite(c[0]) && Number.isFinite(c[1]);
};

const IncidentMap = ({ incidents = [], center = [20.5937, 78.9629], zoom = 5, fitToIncidents = true }) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const clusterRef = useRef(null);
    const heatRef = useRef(null);
    const fittedRef = useRef(false);
    const [selectedId, setSelectedId] = useState(null);
    const [showHeatMap, setShowHeatMap] = useState(false);

    // Create the map once
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return undefined;

        const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true }).setView(center, zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        clusterRef.current = L.markerClusterGroup({
            chunkedLoading: true,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            iconCreateFunction: clusterIcon
        });
        map.addLayer(clusterRef.current);

        // "View details" buttons inside popups
        map.on('popupopen', (e) => {
            const btn = e.popup.getElement()?.querySelector('[data-incident-id]');
            if (btn) btn.onclick = () => setSelectedId(btn.getAttribute('data-incident-id'));
        });

        mapRef.current = map;
        return () => {
            map.remove();
            mapRef.current = null;
            clusterRef.current = null;
            heatRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Markers
    useEffect(() => {
        const map = mapRef.current;
        const cluster = clusterRef.current;
        if (!map || !cluster) return;

        cluster.clearLayers();
        const valid = incidents.filter(validCoords);

        valid.forEach((incident) => {
            const [lng, lat] = incident.location.coordinates;
            const marker = L.marker([lat, lng], { icon: markerIcon(incident.type, incident.severity, incident.status) });
            marker.bindPopup(`
                <div style="min-width:200px;font-family:system-ui">
                    <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#0f172a">${escapeHtml(incident.title)}</div>
                    <div style="font-size:12px;color:#475569;line-height:1.6">
                        <div><b>Type:</b> ${escapeHtml(incident.type)}</div>
                        <div><b>Severity:</b> ${escapeHtml(incident.severity)}</div>
                        <div><b>Status:</b> ${escapeHtml(STATUS_LABELS[incident.status] || incident.status)}</div>
                        <div><b>Confirmations:</b> ${incident.verificationCount || 0}</div>
                        ${incident.location?.address ? `<div><b>Address:</b> ${escapeHtml(incident.location.address)}</div>` : ''}
                    </div>
                    <button data-incident-id="${escapeHtml(incident._id)}" style="margin-top:8px;width:100%;padding:6px;background:#2563eb;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer">View details</button>
                </div>
            `);
            cluster.addLayer(marker);
        });

        // Zoom to the incidents the first time they arrive
        if (fitToIncidents && !fittedRef.current && valid.length > 0) {
            const bounds = L.latLngBounds(valid.map(i => [i.location.coordinates[1], i.location.coordinates[0]]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            fittedRef.current = true;
        }
    }, [incidents, fitToIncidents]);

    // Heat map layer
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (heatRef.current) {
            map.removeLayer(heatRef.current);
            heatRef.current = null;
        }
        if (!showHeatMap) return;

        const points = incidents.filter(validCoords).map((inc) => {
            const [lng, lat] = inc.location.coordinates;
            const intensity = { critical: 1, high: 0.7, medium: 0.4, low: 0.2 }[inc.severity] || 0.3;
            return [lat, lng, intensity];
        });
        heatRef.current = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.0: '#3b82f6', 0.5: '#f59e0b', 1.0: '#ef4444' }
        }).addTo(map);
    }, [incidents, showHeatMap]);

    const selected = incidents.find(i => i._id === selectedId);

    return (
        <div className="relative w-full h-full">
            <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-0" style={{ minHeight: '500px' }} />

            <div className="absolute top-4 right-4 z-[1000]">
                <button
                    onClick={() => setShowHeatMap(v => !v)}
                    className={`px-4 py-2 rounded-xl border font-bold text-sm shadow-lg ${showHeatMap
                        ? 'bg-red-500/90 border-red-400 text-white'
                        : 'bg-slate-900/90 border-white/20 text-white hover:bg-slate-800/90'}`}
                >
                    {showHeatMap ? 'Hide heat map' : 'Show heat map'}
                </button>
            </div>

            <IncidentDetailModal
                incident={selected}
                isOpen={Boolean(selected)}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
};

export default IncidentMap;
