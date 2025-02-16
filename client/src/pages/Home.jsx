import { Link } from "react-router-dom";
import {
    ArrowRightIcon,
    FireIcon,
    ChartBarIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

const features = [
    {
        name: "Real-time Exercise Detection",
        description:
            "AI-powered exercise recognition for accurate form tracking",
        icon: FireIcon,
    },
    {
        name: "Progress Tracking",
        description: "Track your fitness journey with detailed analytics",
        icon: ChartBarIcon,
    },
    {
        name: "Community Challenges",
        description: "Compete with friends and join global fitness challenges",
        icon: UserGroupIcon,
    },
];

export default function Home() {
    return (
        <div className="py-10">
            {/* Hero section */}
            <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                    Transform Your Fitness Journey
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                    Get fit with AI-powered workout tracking and join a
                    community of fitness enthusiasts.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link
                        to="/workout"
                        className="btn-primary inline-flex items-center"
                    >
                        Start Workout
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                    <Link to="/leaderboard" className="btn-secondary">
                        View Leaderboard
                    </Link>
                </div>
            </div>

            {/* Features section */}
            <div className="mt-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-primary-600">
                            Get Started
                        </h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Everything you need to stay fit
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                            {features.map((feature) => (
                                <div
                                    key={feature.name}
                                    className="flex flex-col"
                                >
                                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                                        <feature.icon
                                            className="h-5 w-5 flex-none text-primary-600"
                                            aria-hidden="true"
                                        />
                                        {feature.name}
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                        <p className="flex-auto">
                                            {feature.description}
                                        </p>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
