import { create } from 'zustand';
import api, { getErrorMessage } from '../utils/api';

const replaceIn = (list, incident) => list.map(inc => (inc._id === incident._id ? { ...inc, ...incident } : inc));

const useIncidentStore = create((set, get) => ({
    incidents: [],
    total: 0,
    currentIncident: null,
    isLoading: false,
    hasLoaded: false,
    error: null,
    filters: {
        type: '',
        status: '',
        severity: '',
        search: '',
        sort: '-createdAt'
    },

    lastQuery: {},

    // Re-run the last list query (used for polling when live updates are unavailable)
    refresh: async () => {
        try {
            const params = Object.fromEntries(
                Object.entries({ limit: 100, ...get().filters, ...get().lastQuery })
                    .filter(([, v]) => v !== '' && v != null)
            );
            const response = await api.get('/incidents', { params });
            set({ incidents: response.data.data, total: response.data.total });
        } catch {
            // keep showing the last data
        }
    },

    // Fetch incidents using the current filters (plus optional overrides)
    fetchIncidents: async (queryParams = {}) => {
        set({ isLoading: true, error: null, lastQuery: queryParams });
        try {
            const params = Object.fromEntries(
                Object.entries({ limit: 100, ...get().filters, ...queryParams })
                    .filter(([, v]) => v !== '' && v != null)
            );
            const response = await api.get('/incidents', { params });
            set({
                incidents: response.data.data,
                total: response.data.total,
                isLoading: false,
                hasLoaded: true
            });
            return { success: true, data: response.data.data };
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to fetch incidents');
            set({ isLoading: false, error: message, hasLoaded: true });
            return { success: false, error: message };
        }
    },

    fetchIncident: async (id) => {
        try {
            const response = await api.get(`/incidents/${id}`);
            set({ currentIncident: response.data.data });
            return { success: true, data: response.data.data };
        } catch (error) {
            return { success: false, error: getErrorMessage(error, 'Failed to fetch incident') };
        }
    },

    createIncident: async (incidentData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/incidents', incidentData);
            const newIncident = response.data.data;
            get().addIncident(newIncident);
            set({ isLoading: false });
            return { success: true, data: newIncident, possibleDuplicates: response.data.possibleDuplicates };
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to create incident');
            set({ isLoading: false, error: message });
            return { success: false, error: message };
        }
    },

    // Staff: update status / severity / assignment
    updateIncidentFields: async (id, updates) => {
        try {
            const response = await api.put(`/incidents/${id}`, updates);
            get().updateIncident(response.data.data);
            return { success: true, data: response.data.data };
        } catch (error) {
            return { success: false, error: getErrorMessage(error, 'Failed to update incident') };
        }
    },

    updateIncidentStatus: async (id, status) => get().updateIncidentFields(id, { status }),

    addNote: async (id, note) => {
        try {
            const response = await api.post(`/incidents/${id}/notes`, { note });
            get().updateIncident(response.data.data);
            return { success: true, data: response.data.data };
        } catch (error) {
            return { success: false, error: getErrorMessage(error, 'Failed to add note') };
        }
    },

    deleteIncident: async (id) => {
        try {
            await api.delete(`/incidents/${id}`);
            get().removeIncident(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: getErrorMessage(error, 'Failed to delete incident') };
        }
    },

    verifyIncident: async (id) => {
        try {
            const response = await api.post(`/incidents/${id}/verify`);
            get().updateIncident(response.data.data);
            return { success: true, data: response.data.data };
        } catch (error) {
            return { success: false, error: getErrorMessage(error, 'Failed to verify incident') };
        }
    },

    // Real-time helpers (idempotent: the creator also receives the socket event)
    addIncident: (incident) => {
        set((state) => {
            if (state.incidents.some(inc => inc._id === incident._id)) {
                return { incidents: replaceIn(state.incidents, incident) };
            }
            return { incidents: [incident, ...state.incidents], total: state.total + 1 };
        });
    },

    updateIncident: (incident) => {
        set((state) => ({
            incidents: replaceIn(state.incidents, incident),
            currentIncident: state.currentIncident?._id === incident._id
                ? { ...state.currentIncident, ...incident }
                : state.currentIncident
        }));
    },

    removeIncident: (id) => {
        set((state) => ({
            incidents: state.incidents.filter(inc => inc._id !== id),
            total: Math.max(0, state.total - (state.incidents.some(inc => inc._id === id) ? 1 : 0)),
            currentIncident: state.currentIncident?._id === id ? null : state.currentIncident
        }));
    },

    setFilters: (filters) => {
        set((state) => ({ filters: { ...state.filters, ...filters } }));
    },

    clearError: () => set({ error: null })
}));

export default useIncidentStore;
