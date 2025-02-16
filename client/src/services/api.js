import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth services
export const authService = {
    login: async (credentials) => {
        const response = await api.post("/login", credentials);
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post("/register", userData);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },

    getCurrentUser: () => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },
};

// Profile services
export const profileService = {
    getProfile: async () => {
        const response = await api.get("/profile");
        return response.data;
    },

    updateProfile: async (profileData) => {
        const response = await api.put("/profile", profileData);
        return response.data;
    },
};

// Workout services
export const workoutService = {
    addWorkout: async (workoutData) => {
        const response = await api.post("/workouts", workoutData);
        return response.data;
    },

    getWorkouts: async () => {
        const response = await api.get("/workouts");
        return response.data;
    },
};

// Error handling interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authService.logout();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
