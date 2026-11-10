import SupportChatbot from "./components/SupportChatbot";
import React, { useCallback, useState } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import RecruiterCandidates from "./pages/RecruiterCandidates";
import HRDashboard from "./pages/HRDashboard";
import HRJobs from "./pages/HRJobs";
import RoleRoute from "./components/RoleRoute";
import RoleRedirect from "./pages/RoleRedirect";
import VerifyResetOTP from "./pages/VerifyResetOTP";
import VerifyEmailOTP from "./pages/VerifyEmailOTP";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    const openSidebar = useCallback(() => {
        setSidebarOpen(true);
    }, []);

    const toggleSidebarCollapse = useCallback(() => {
        setSidebarCollapsed((current) => !current);
    }, []);

    return (
        <div
            className={`app-layout ${
                sidebarCollapsed ? "sidebar-is-collapsed" : ""
            }`}
        >
            <Sidebar
                isOpen={sidebarOpen}
                onOpenSidebar={openSidebar}
                onClose={closeSidebar}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
            />

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

function AdminAccountsRedirect() {
    const token = localStorage.getItem("access_token");
    const [allowed, setAllowed] = useState(null);
    React.useEffect(() => {
        let active = true;
        if (!token) { setAllowed(false); return () => { active = false; }; }
        import("./services/recruiterApi").then(({ getCurrentUser }) => getCurrentUser())
            .then((user) => { if (active) setAllowed(user.role === "admin"); })
            .catch(() => { if (active) setAllowed(false); });
        return () => { active = false; };
    }, [token]);
    React.useEffect(() => {
        if (allowed) window.location.replace("/admin/");
    }, [allowed]);
    if (allowed === null) return <div className="role-route-loading">Checking administrator access…</div>;
    if (!allowed) return <Navigate to="/login" replace />;
    return <div className="role-route-loading">Opening administrator console…</div>;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                {/* Public authentication routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/hr/login" element={<Navigate to="/login?portal=recruiter" replace />} />
                <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
                <Route path="/portal" element={<RoleRedirect />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/verify-email-otp"
                    element={<VerifyEmailOTP />}
                />
                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />
                <Route
                    path="/verify-reset-otp"
                    element={<VerifyResetOTP />}
                />
                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />

                {/* Protected application routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <Dashboard />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <Profile />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/education"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <Education />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/skills"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <Skills />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/experience"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <Experience />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/resume"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <Resume />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/resume/:id/analysis"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <ResumeAnalysis />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/jobs"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <Jobs />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/skill-gap"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <SkillGap />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-applications"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <MyApplications />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/ai-interview"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <AIInterview />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/interview-history"
                    element={
                        <ProtectedRoute>
                            <ProtectedPage>
                                <InterviewHistory />
                            </ProtectedPage>
                        </ProtectedRoute>
                    }
                />
                {/* Recruiter workspace: role is verified against the backend on every route. */}
                <Route path="/hr/dashboard" element={<RoleRoute allow={["recruiter"]}><HRDashboard /></RoleRoute>} />
                <Route path="/hr/jobs" element={<RoleRoute allow={["recruiter"]}><HRJobs /></RoleRoute>} />
                <Route path="/hr/candidates" element={<RoleRoute allow={["recruiter"]}><RecruiterCandidates /></RoleRoute>} />
                <Route path="/admin/accounts" element={<AdminAccountsRedirect />} />

                <Route path="*" element={<Navigate to="/portal" replace />} />
            </Routes>
            <SupportChatbot />
        </BrowserRouter>
        
    );
}

export default App;
