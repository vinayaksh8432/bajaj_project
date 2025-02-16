import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
    HomeIcon,
    UserIcon,
    TrophyIcon,
    PlayIcon,
    ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../store/authStore";

const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Workout", href: "/workout", icon: PlayIcon },
    { name: "Profile", href: "/profile", icon: UserIcon },
    { name: "Leaderboard", href: "/leaderboard", icon: TrophyIcon },
];

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="min-h-full">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex">
                            <div className="flex flex-shrink-0 items-center">
                                <span className="text-2xl font-bold text-primary-600">
                                    FLEX-IT-OUT
                                </span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navigation.map((item) => {
                                    const isActive =
                                        location.pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={`
                                                inline-flex items-center px-1 pt-1 text-sm font-medium
                                                ${
                                                    isActive
                                                        ? "border-b-2 border-primary-500 text-gray-900"
                                                        : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                                }
                                            `}
                                        >
                                            <item.icon className="h-5 w-5 mr-1" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Sign Out Button */}
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile navigation */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
                <div className="flex justify-around">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`
                                    flex flex-col items-center p-2 text-xs
                                    ${
                                        isActive
                                            ? "text-primary-600"
                                            : "text-gray-500 hover:text-gray-700"
                                    }
                                `}
                            >
                                <item.icon className="h-6 w-6" />
                                {item.name}
                            </Link>
                        );
                    })}
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center p-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                        <ArrowRightOnRectangleIcon className="h-6 w-6" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main content */}
            <main>
                <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
