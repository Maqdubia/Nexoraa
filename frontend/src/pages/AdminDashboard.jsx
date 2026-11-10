
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login", { replace: true });
    };

    return (
        <main style={{
            minHeight: "100vh",
            background: "#f8f6f0",
            padding: "40px",
            color: "#243b32",
            fontFamily: "Arial, sans-serif"
        }}>
            <header style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e5e0d5",
                paddingBottom: "20px"
            }}>
                <div>
                    <h1 style={{ margin: 0 }}>NEXORA</h1>
                    <p style={{ color: "#75877c" }}>ADMINISTRATION</p>
                </div>
                <button onClick={handleLogout}>Sign out</button>
            </header>

            <section style={{ marginTop: "50px" }}>
                <h2>Admin Dashboard</h2>
                <p>Welcome to your Nexora platform administration.</p>

                <div style={{
                    marginTop: "30px",
                    padding: "25px",
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e5e0d5"
                }}>
                    <h3>Platform Management</h3>
                    <p>Manage recruiter access and oversee the Nexora platform.</p>
                    <p><strong>Account:</strong> nexora.job.app@gmail.com</p>
                    <p><strong>Role:</strong> Administrator</p>
                </div>
            </section>
        </main>
    );
}

export default AdminDashboard;
