// Format date to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return plural(Math.floor(diffInSeconds / 60), 'minute');
    if (diffInSeconds < 86400) return plural(Math.floor(diffInSeconds / 3600), 'hour');
    if (diffInSeconds < 604800) return plural(Math.floor(diffInSeconds / 86400), 'day');

    return past.toLocaleDateString();
};

// Format date to readable string
export const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Human-friendly duration from hours (e.g. 0.5 -> "30m", 26 -> "1d 2h")
export const formatHours = (hours) => {
    if (!hours || hours <= 0) return '—';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
};

// Capitalize first letter
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Format [lng, lat] coordinates for display
export const formatCoordinates = (coords) => {
    if (!coords || coords.length !== 2) return 'Unknown';
    const [lng, lat] = coords;
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lng).toFixed(4)}°${ew}`;
};

// Truncate text
export const truncate = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Get user's current location
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                const messages = {
                    1: 'Location permission denied. Pick the location on the map instead.',
                    2: 'Location unavailable. Pick the location on the map instead.',
                    3: 'Location request timed out. Try again or pick on the map.'
                };
                reject(new Error(messages[error.code] || error.message));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000
            }
        );
    });
};

// Escape text before inserting into raw HTML (e.g. Leaflet popups)
export const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Compare two ids that may be strings or populated objects
export const sameId = (a, b) => {
    const idA = a?._id || a?.id || a;
    const idB = b?._id || b?.id || b;
    return Boolean(idA && idB && String(idA) === String(idB));
};

export const hasUserVerified = (incident, user) =>
    Boolean(user && incident?.verifications?.some(v => sameId(v.userId, user)));

export const isReporter = (incident, user) => Boolean(user && sameId(incident?.reporter?.userId, user));

// Google Maps link for [lng, lat]
export const mapsLink = (coords) => {
    if (!coords || coords.length !== 2) return null;
    const [lng, lat] = coords;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};
