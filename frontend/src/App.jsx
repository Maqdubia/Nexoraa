
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Education from "./pages/Education";
import Skills from "./pages/Skills";
import Experience from "./pages/Experience";
import Resume from "./pages/Resume";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import Jobs from "./pages/Jobs";
import SkillGap from "./pages/SkillGap";
import MyApplications from "./pages/MyApplications";
import AIInterview from "./pages/AIInterview";
import InterviewHistory from "./pages/InterviewHistory";

import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

import "./App.css";

function ProtectedPage({ children }) {
    return (
        <ProtectedRoute>
            <div className="app-layout">
                <Sidebar />

                <main className="main-content">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Pages */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

               
<Route
    path="/login"
    element={<Login />}
/>

<Route
    path="/forgot-password"
    element={<ForgotPassword />}
/>

<Route
    path="/register"
    element={<Register />}
/>


                {/* Dashboard - First Protected Page */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedPage>
                            <Dashboard />
                        </ProtectedPage>
                    }
                />

                {/* Profile */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedPage>
                            <Profile />
                        </ProtectedPage>
                    }
                />

                {/* Education */}
                <Route
                    path="/education"
                    element={
                        <ProtectedPage>
                            <Education />
                        </ProtectedPage>
                    }
                />

                {/* Skills */}
                <Route
                    path="/skills"
                    element={
                        <ProtectedPage>
                            <Skills />
                        </ProtectedPage>
                    }
                />

                {/* Experience */}
                <Route
                    path="/experience"
                    element={
                        <ProtectedPage>
                            <Experience />
                        </ProtectedPage>
                    }
                />

                {/* Resume */}
                <Route
                    path="/resume"
                    element={
                        <ProtectedPage>
                            <Resume />
                        </ProtectedPage>
                    }
                />

                {/* Resume Analysis */}
                <Route
                    path="/resume/:id/analysis"
                    element={
                        <ProtectedPage>
                            <ResumeAnalysis />
                        </ProtectedPage>
                    }
                />

                {/* Jobs */}
                <Route
                    path="/jobs"
                    element={
                        <ProtectedPage>
                            <Jobs />
                        </ProtectedPage>
                    }
                />

                {/* Skill Gap */}
                <Route
                    path="/skill-gap"
                    element={
                        <ProtectedPage>
                            <SkillGap />
                        </ProtectedPage>
                    }
                />

                {/* My Applications */}
                <Route
                    path="/my-applications"
                    element={
                        <ProtectedPage>
                            <MyApplications />
                        </ProtectedPage>
                    }
                />

                {/* AI Interview */}
                <Route
                    path="/ai-interview"
                    element={
                        <ProtectedPage>
                            <AIInterview />
                        </ProtectedPage>
                    }
                />

                {/* Interview History */}
                <Route
                    path="/interview-history"
                    element={
                        <ProtectedPage>
                            <InterviewHistory />
                        </ProtectedPage>
                    }
                />

                {/* Unknown URL */}
                <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
