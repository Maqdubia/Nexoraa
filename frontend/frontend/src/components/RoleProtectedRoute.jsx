import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/recruiterApi";

function RoleProtectedRoute({ allowedRoles, children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;

        getCurrentUser()
            .then((data) => {
                if (active) setUser(data);
            })
            .catch(() => {
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return <div className="portal-loading">Checking account...</div>;
    }

    if (error || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/portal" replace />;
    }

    return children;
}

export default RoleProtectedRoute;
