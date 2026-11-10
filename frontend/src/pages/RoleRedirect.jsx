import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/recruiterApi";

export default function RoleRedirect() {
  const [role, setRole] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { let active = true; getCurrentUser().then((user) => { if (active) setRole(user.role); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, []);
  if (failed) return <Navigate to="/login" replace />;
  if (!role) return <div className="role-route-loading">Opening your Nexora workspace…</div>;
  if (role === "admin") return <Navigate to="/admin/accounts" replace />;
  if (role === "recruiter") return <Navigate to="/hr/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}
