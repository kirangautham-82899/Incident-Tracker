import api from './api';

// Responder list (with live workload) shared across staff components
let respondersCache = null;

export const loadResponders = async (force = false) => {
    if (!respondersCache || force) {
        const res = await api.get('/users/responders');
        respondersCache = res.data.data;
    }
    return respondersCache;
};
