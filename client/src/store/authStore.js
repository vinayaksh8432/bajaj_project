import { create } from "zustand";
import { authService } from "../services/api";

const useAuthStore = create((set) => ({
    user: authService.getCurrentUser(),
    isAuthenticated: !!authService.getCurrentUser(),
    isLoading: false,
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const data = await authService.login(credentials);
            set({ user: data.user, isAuthenticated: true, isLoading: false });
            return data;
        } catch (error) {
            set({
                error:
                    error.response?.data?.error ||
                    "An error occurred during login",
                isLoading: false,
            });
            throw error;
        }
    },

    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const data = await authService.register(userData);
            set({ isLoading: false });
            return data;
        } catch (error) {
            set({
                error:
                    error.response?.data?.error ||
                    "An error occurred during registration",
                isLoading: false,
            });
            throw error;
        }
    },

    logout: () => {
        authService.logout();
        set({ user: null, isAuthenticated: false });
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
