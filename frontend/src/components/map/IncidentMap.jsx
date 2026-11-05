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

// Severity-sized dot with a paper ring; critical open incidents pulse
const markerIcon = (type, severity, status) => {
    const color = TYPE_COLORS[type] || '#6E6D76';
    const size = { critical: 22, high: 18, medium: 15, low: 13 }[severity] || 15;
    const closed = status === 'resolved' || status === 'false';
    const pulse = severity === 'critical' && !closed
        ? `<span class="animate-pulse-dot" style="position:absolute;inset:0;border-radius:999px;background:${color}"></span>`
        : '';
    return L.divIcon({
        html: `<span style="position:relative;display:block;width:${size}px;height:${size}px">${pulse}<span style="position:absolute;inset:0;border-radius:999px;background:${color};opacity:${closed ? 0.35 : 1};box-shadow:0 0 0 3px #FAF9F6,0 6px 14px -4px rgba(22,22,26,.45)"></span></span>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2 - 4]
    });
};

const clusterIcon = (cluster) => {
    const count = cluster.getChildCount();
    const size = count > 20 ? 46 : count > 5 ? 40 : 34;
    return L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:#16161A;color:#FAF9F6;border-radius:999px;display:flex;align-items:center;justify-content:center;font:600 13px Inter,system-ui;box-shadow:0 0 0 4px rgba(22,22,26,.12),0 8px 18px -6px rgba(22,22,26,.5)">${count}</div>`,
        className: '',
        iconSize: L.point(size, size)
    });
};

const validCoords = (inc) => {
    const c = inc.location?.coordinates;
    return Array.isArray(c) && c.length === 2 && Number.isFinite(c[0]) && Number.isFinite(c[1]);
};

const IncidentMap = ({ incidents = [], center = [20.5937, 78.9629], zoom = 5, fitToIncidents = true, showHeatMap = false }) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const clusterRef = useRef(null);
    const heatRef = useRef(null);
    const fittedRef = useRef(false);
    const [selectedId, setSelectedId] = useState(null);

    // Create the map once
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return undefined;

        const map = L.map(containerRef.current, { zoomControl: false, scrollWheelZoom: true }).setView(center, zoom);
        L.control.zoom({ position: 'bottomright' }).addTo(map);
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
                    <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#16161A">${escapeHtml(incident.title)}</div>
                    <div style="font-size:12px;color:#6E6D76;line-height:1.6">
                        <div><b>Type:</b> ${escapeHtml(incident.type)}</div>
                        <div><b>Severity:</b> ${escapeHtml(incident.severity)}</div>
                        <div><b>Status:</b> ${escapeHtml(STATUS_LABELS[incident.status] || incident.status)}</div>
                        <div><b>Confirmations:</b> ${incident.verificationCount || 0}</div>
                        ${incident.location?.address ? `<div><b>Address:</b> ${escapeHtml(incident.location.address)}</div>` : ''}
                    </div>
                    <button data-incident-id="${escapeHtml(incident._id)}" style="margin-top:10px;width:100%;padding:8px;background:#16161A;color:#FAF9F6;border:none;border-radius:999px;font:500 13px Inter,system-ui;cursor:pointer">View details</button>
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
            gradient: { 0.2: '#2F9E6E', 0.5: '#C98A12', 0.8: '#E06B1F', 1.0: '#D7262E' }
        }).addTo(map);
    }, [incidents, showHeatMap]);

    const selected = incidents.find(i => i._id === selectedId);

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="z-0 h-full w-full" />
            <IncidentDetailModal incident={selected} isOpen={Boolean(selected)} onClose={() => setSelectedId(null)} />
        </div>
    );
};

export default IncidentMap;
