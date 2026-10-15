
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
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
import Dashboard from "./pages/Dashboard";

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
                {/* Public pages */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Protected pages */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedPage>
                            <Profile />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/education"
                    element={
                        <ProtectedPage>
                            <Education />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/skills"
                    element={
                        <ProtectedPage>
                            <Skills />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/experience"
                    element={
                        <ProtectedPage>
                            <Experience />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/resume"
                    element={
                        <ProtectedPage>
                            <Resume />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/resume/:id/analysis"
                    element={
                        <ProtectedPage>
                            <ResumeAnalysis />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/jobs"
                    element={
                        <ProtectedPage>
                            <Jobs />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/skill-gap"
                    element={
                        <ProtectedPage>
                            <SkillGap />
                        </ProtectedPage>
                    }
                />

                <Route
                    path="/my-applications"
                    element={
                        <ProtectedPage>
                            <MyApplications />
                        </ProtectedPage>
                    }
                />

                {/* AI Interview Practice */}
              
{/* AI Interview Practice */}
<Route
    path="/ai-interview"
    element={
        <ProtectedPage>
            <AIInterview />
        </ProtectedPage>
    }

/>


{/* AI Interview History */}
<Route
    path="/interview-history"
    element={
        <ProtectedPage>
            <InterviewHistory />
        </ProtectedPage>
    }
/>
       
       
       <Route
    path="/dashboard"
    element={
        <ProtectedPage>
            <Dashboard />
        </ProtectedPage>
    }
/>
                {/* Unknown URL */}
                <Route
                    path="*"
                    element={<Navigate to="/profile" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
