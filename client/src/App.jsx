import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load components
const Layout = lazy(() => import("./components/Layout"));
const Home = lazy(() => import("./pages/Home"));
const Workout = lazy(() => import("./pages/Workout"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

// Loading component
const Loading = () => (
    <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-pulse-slow">
            <div className="h-32 w-32 bg-primary-500 rounded-full"></div>
        </div>
    </div>
);

function App() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Home />} />
                    <Route path="workout" element={<Workout />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="leaderboard" element={<Leaderboard />} />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}

export default App;
