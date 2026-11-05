import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { getErrorMessage, setUnauthorizedHandler } from '../utils/api';
import socketService from '../utils/socket';

const normalizeUser = (user) => (user ? { ...user, _id: user._id || user.id } : null);

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            _setSession: (user, token) => {
                localStorage.setItem('token', token);
                set({ user: normalizeUser(user), token, isAuthenticated: true, isLoading: false, error: null });
                socketService.connect(token);
            },

            register: async (userData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/register', userData);
                    const { user, token } = response.data.data;
                    get()._setSession(user, token);
                    return { success: true, user };
                } catch (error) {
                    const message = getErrorMessage(error, 'Registration failed');
                    set({ isLoading: false, error: message });
                    return { success: false, error: message };
                }
            },

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', credentials);
                    const { user, token } = response.data.data;
                    get()._setSession(user, token);
                    return { success: true, user };
                } catch (error) {
                    const message = getErrorMessage(error, 'Login failed');
                    set({ isLoading: false, error: message });
                    return { success: false, error: message };
                }
            },

            // Re-fetch the profile (reputation, counters and role change over time)
            refreshUser: async () => {
                if (!get().token) return;
                try {
                    const response = await api.get('/auth/me');
                    set({ user: normalizeUser(response.data.data) });
                } catch {
                    // 401 is handled by the interceptor
                }
            },

            updateProfile: async (updates) => {
                try {
                    const response = await api.put('/auth/me', updates);
                    set({ user: normalizeUser(response.data.data) });
                    return { success: true };
                } catch (error) {
                    return { success: false, error: getErrorMessage(error, 'Update failed') };
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null, token: null, isAuthenticated: false, error: null });
                socketService.connect(null);
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => (state) => {
                // Keep the token used by axios in sync with the persisted session
                if (state?.token) localStorage.setItem('token', state.token);
                else localStorage.removeItem('token');
            }
        }
    )
);

setUnauthorizedHandler(() => {
    useAuthStore.getState().logout();
});

export default useAuthStore;
