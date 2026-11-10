import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/recruiterApi";

function RoleRedirect() {
    const [role, setRole] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        getCurrentUser()
            .then((user) => setRole(user.role))
            .catch(() => setFailed(true));
    }, []);

    if (failed) {
        return <Navigate to="/login" replace />;
    }

    if (!role) {
        return <div className="portal-loading">Opening your Nexora portal...</div>;
    }

    if (role === "admin") {
        return <Navigate to="/hr/dashboard" replace />;
    }

    if (role === "hr") {
        return <Navigate to="/hr/dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
}

export default RoleRedirect;
