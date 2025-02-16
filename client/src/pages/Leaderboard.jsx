import { useState } from "react";
import {
    TrophyIcon,
    FireIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

const mockLeaderboard = [
    { rank: 1, name: "Sarah Johnson", points: 2500, workouts: 45 },
    { rank: 2, name: "Mike Chen", points: 2350, workouts: 42 },
    { rank: 3, name: "Emily Davis", points: 2200, workouts: 40 },
    { rank: 4, name: "Alex Thompson", points: 2100, workouts: 38 },
    { rank: 5, name: "Chris Wilson", points: 2000, workouts: 36 },
];

const mockChallenges = [
    {
        id: 1,
        title: "30-Day Fitness Challenge",
        participants: 245,
        description: "Complete 30 days of consistent workouts",
        endDate: "2024-03-15",
    },
    {
        id: 2,
        title: "Squad Goals",
        participants: 156,
        description: "Achieve 1000 squats in a week",
        endDate: "2024-03-10",
    },
    {
        id: 3,
        title: "Push-up Master",
        participants: 189,
        description: "Complete 500 push-ups in 5 days",
        endDate: "2024-03-08",
    },
];

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState("global");

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-12">
                <TrophyIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900">
                    Global Leaderboard
                </h1>
                <p className="mt-2 text-gray-600">
                    Compete with fitness enthusiasts worldwide
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center space-x-4 mb-8">
                <button
                    onClick={() => setActiveTab("global")}
                    className={`px-4 py-2 rounded-full ${
                        activeTab === "global"
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                    Global Rankings
                </button>
                <button
                    onClick={() => setActiveTab("challenges")}
                    className={`px-4 py-2 rounded-full ${
                        activeTab === "challenges"
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                    Active Challenges
                </button>
            </div>

            {/* Content */}
            {activeTab === "global" ? (
                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rank
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Points
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Workouts
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {mockLeaderboard.map((user) => (
                                    <tr
                                        key={user.rank}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {user.rank <= 3 ? (
                                                    <TrophyIcon
                                                        className={`h-5 w-5 mr-2 ${
                                                            user.rank === 1
                                                                ? "text-yellow-400"
                                                                : user.rank ===
                                                                  2
                                                                ? "text-gray-400"
                                                                : "text-orange-400"
                                                        }`}
                                                    />
                                                ) : (
                                                    <span className="text-gray-500 mr-2">
                                                        #{user.rank}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {user.points}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {user.workouts}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockChallenges.map((challenge) => (
                        <div
                            key={challenge.id}
                            className="card hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {challenge.title}
                                    </h3>
                                    <p className="mt-2 text-gray-600">
                                        {challenge.description}
                                    </p>
                                </div>
                                <FireIcon className="h-6 w-6 text-primary-600" />
                            </div>
                            <div className="mt-4 flex items-center text-sm text-gray-500">
                                <UserGroupIcon className="h-4 w-4 mr-1" />
                                <span>
                                    {challenge.participants} participants
                                </span>
                            </div>
                            <div className="mt-4">
                                <span className="text-xs text-gray-500">
                                    Ends on {challenge.endDate}
                                </span>
                            </div>
                            <button className="mt-4 w-full btn-primary">
                                Join Challenge
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
