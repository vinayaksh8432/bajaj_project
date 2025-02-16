import { create } from "zustand";
import { workoutService } from "../services/api";

const useWorkoutStore = create((set, get) => ({
    workouts: [],
    currentWorkout: null,
    isLoading: false,
    error: null,

    // Fetch user's workout history
    fetchWorkouts: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await workoutService.getWorkouts();
            set({ workouts: data, isLoading: false });
        } catch (error) {
            set({
                error:
                    error.response?.data?.error || "Failed to fetch workouts",
                isLoading: false,
            });
        }
    },

    // Add a new workout
    addWorkout: async (workoutData) => {
        set({ isLoading: true, error: null });
        try {
            // Format the date to match the server's expected format
            const formattedData = {
                ...workoutData,
                date: new Date(workoutData.date).toISOString().split(".")[0],
            };

            const response = await workoutService.addWorkout(formattedData);
            set((state) => ({
                workouts: [...state.workouts, response.data],
                isLoading: false,
            }));
            return response.data;
        } catch (error) {
            set({
                error: error.response?.data?.error || "Failed to add workout",
                isLoading: false,
            });
            throw error;
        }
    },

    // Set current workout for tracking
    setCurrentWorkout: (workout) => {
        set({ currentWorkout: workout });
    },

    // Update current workout progress
    updateWorkoutProgress: (progress) => {
        set((state) => ({
            currentWorkout: {
                ...state.currentWorkout,
                ...progress,
            },
        }));
    },

    // Clear current workout
    clearCurrentWorkout: () => {
        set({ currentWorkout: null });
    },

    // Clear any errors
    clearError: () => set({ error: null }),
}));

export default useWorkoutStore;
