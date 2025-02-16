import { useEffect } from "react";
import {
    UserCircleIcon,
    FireIcon,
    ClockIcon,
    TrophyIcon,
} from "@heroicons/react/24/outline";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import useAuthStore from "../store/authStore";
import useWorkoutStore from "../store/workoutStore";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function Profile() {
    const { user } = useAuthStore();
    const { workouts, fetchWorkouts, isLoading } = useWorkoutStore();

    useEffect(() => {
        fetchWorkouts();
    }, [fetchWorkouts]);

    // Calculate stats from workout data
    const calculateStats = () => {
        const totalWorkouts = workouts.length;
        const totalReps = workouts.reduce(
            (sum, workout) => sum + workout.reps,
            0
        );
        const achievements = Math.floor(totalReps / 100); // Example: 1 achievement per 100 reps

        return [
            {
                name: "Total Workouts",
                value: totalWorkouts.toString(),
                icon: FireIcon,
            },
            {
                name: "Total Reps",
                value: totalReps.toString(),
                icon: ClockIcon,
            },
            {
                name: "Achievements",
                value: achievements.toString(),
                icon: TrophyIcon,
            },
        ];
    };

    // Prepare chart data
    const prepareChartData = () => {
        // Group workouts by date and sum reps
        const last7Days = [...Array(7)]
            .map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split("T")[0];
            })
            .reverse();

        const dailyReps = last7Days.map((date) => {
            const dayWorkouts = workouts.filter(
                (w) => w.date.split("T")[0] === date
            );
            return {
                date: new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                }),
                count: dayWorkouts.reduce((sum, w) => sum + w.reps, 0),
            };
        });

        return {
            labels: dailyReps.map((d) => d.date),
            datasets: [
                {
                    label: "Daily Reps",
                    data: dailyReps.map((d) => d.count),
                    borderColor: "rgb(34, 197, 94)",
                    backgroundColor: "rgba(34, 197, 94, 0.5)",
                    tension: 0.4,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Weekly Workout Progress",
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse-slow">
                    <div className="h-32 w-32 bg-primary-500 rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="card mb-8">
                <div className="flex items-center space-x-4">
                    <UserCircleIcon className="h-16 w-16 text-gray-400" />
                    <div>
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-gray-600">{user.email}</p>
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-medium text-primary-800">
                            {user.level}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
                {calculateStats().map((stat) => (
                    <div key={stat.name} className="card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <stat.icon className="h-8 w-8 text-primary-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {stat.name}
                                </h3>
                                <p className="text-2xl font-semibold text-primary-600">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress Chart */}
            <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Progress Overview
                </h3>
                <div className="h-80">
                    <Line options={chartOptions} data={prepareChartData()} />
                </div>
            </div>
        </div>
    );
}
