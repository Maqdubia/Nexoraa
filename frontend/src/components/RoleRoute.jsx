import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/recruiterApi";

// Lets only the listed roles in. The backend also checks the role on every
// request, so this is for a smooth experience, not the only protection.
function RoleRoute({ allow, children }) {
    const token = localStorage.getItem("access_token");
    const [state, setState] = useState({ loading: true, role: null });

    useEffect(() => {
        if (!token) {
            setState({ loading: false, role: null });
            return undefined;
        }

        let active = true;

        getCurrentUser()
            .then((user) => {
                if (active) setState({ loading: false, role: user.role });
            })
            .catch(() => {
                if (active) setState({ loading: false, role: null });
            });

        return () => {
            active = false;
        };
    }, [token]);

    if (!token) {
        return <Navigate to="/hr/login" replace />;
    }

    if (state.loading) {
        return (
            <div className="role-route-loading">
                Checking your access…
            </div>
        );
    }

    if (!state.role) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return <Navigate to="/hr/login" replace />;
    }

    if (!allow.includes(state.role)) {
        return <Navigate to="/portal" replace />;
    }

    return children;
}

export default RoleRoute;
