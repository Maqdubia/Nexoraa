
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminUsers, deleteAdminUser } from "../services/api";
import NexoraBrand from "../components/NexoraBrand";
function AdminDashboard() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getAdminUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load accounts. Please refresh and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return users;

        return users.filter((user) =>
            [
                user.email,
                user.username,
                user.full_name,
                user.company,
                user.role,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term))
        );
    }, [users, search]);

    const handleDelete = async (user) => {
        const confirmed = window.confirm(
            `PERMANENT ACCOUNT DELETION\n\n` +
            `Email: ${user.email}\n` +
            `Role: ${user.role}\n\n` +
            `This permanently deletes this account and its associated ` +
            `profile, education, skills, experience, OTP records and job applications.\n\n` +
            `This action cannot be undone.\n\n` +
            `Delete this account?`
        );

        if (!confirmed) return;

        try {
            setDeletingId(user.id);
            setError("");
            setSuccess("");

            await deleteAdminUser(user.id);

            setUsers((previous) =>
                previous.filter((item) => item.id !== user.id)
            );

            setSuccess(`${user.email} was permanently deleted.`);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                `Could not delete ${user.email}. Please try again.`
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login", { replace: true });
    };

    const stats = {
        total: users.length,
        recruiters: users.filter((user) => user.role === "recruiter").length,
        students: users.filter((user) => user.role === "student").length,
    };

    const styles = {
        page: {
            minHeight: "100vh",
            background: "#f7f6f0",
            color: "#233c32",
            fontFamily: "Arial, sans-serif",
            padding: "28px",
        },
        container: {
            maxWidth: "1180px",
            margin: "0 auto",
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            borderBottom: "1px solid #e4e5dc",
            paddingBottom: "22px",
        },
        button: {
            border: "1px solid #d8ded5",
            background: "#fff",
            color: "#29483a",
            borderRadius: "9px",
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: 600,
        },
        card: {
            background: "#fff",
            border: "1px solid #e7e8df",
            borderRadius: "15px",
            padding: "22px",
        },
        muted: {
            color: "#7b887f",
            fontSize: "14px",
        },
        tableWrap: {
            overflowX: "auto",
            width: "100%",
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "720px",
            textAlign: "left",
        },
        cell: {
            padding: "15px 12px",
            borderBottom: "1px solid #edf0e9",
            fontSize: "14px",
        },
        danger: {
            border: "1px solid #e9c9c4",
            background: "#fff8f6",
            color: "#a33f35",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 600,
        },
        notice: {
            padding: "13px 16px",
            borderRadius: "9px",
            marginBottom: "18px",
            fontSize: "14px",
        },
    };

    return (
        <main style={styles.page}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px"
}}>
    <NexoraBrand size="large" />
    <p style={{ ...styles.muted, margin: 0 }}>
        PLATFORM ADMINISTRATION
    </p>
</div>

                    <button style={styles.button} onClick={handleLogout}>
                        Sign out
                    </button>
                </header>

                <section style={{ marginTop: "35px" }}>
                    <p style={{ ...styles.muted, marginBottom: "8px" }}>
                        ADMINISTRATOR WORKSPACE
                    </p>
                    <h2 style={{ fontSize: "28px", margin: "0 0 8px" }}>
                        User Management
                    </h2>
                    <p style={styles.muted}>
                        View and manage registered Nexora platform accounts.
                    </p>
                </section>

                {error && (
                    <div
                        role="alert"
                        style={{
                            ...styles.notice,
                            background: "#fff0ee",
                            color: "#a33f35",
                        }}
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        style={{
                            ...styles.notice,
                            background: "#edf6ed",
                            color: "#356b45",
                        }}
                    >
                        {success}
                    </div>
                )}

                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: "16px",
                        margin: "28px 0",
                    }}
                >
                    {[
                        ["Total accounts", stats.total],
                        ["Students", stats.students],
                        ["Recruiters", stats.recruiters],
                    ].map(([label, value]) => (
                        <div key={label} style={styles.card}>
                            <p style={styles.muted}>{label}</p>
                            <h2 style={{ fontSize: "30px", margin: "8px 0 0" }}>
                                {loading ? "—" : value}
                            </h2>
                        </div>
                    ))}
                </section>

                <section style={styles.card}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "14px",
                            flexWrap: "wrap",
                            marginBottom: "22px",
                        }}
                    >
                        <div>
                            <h3 style={{ margin: "0 0 6px" }}>
                                Registered Accounts
                            </h3>
                            <p style={{ ...styles.muted, margin: 0 }}>
                                Administrator accounts are excluded from this list.
                            </p>
                        </div>

                        <button
                            style={styles.button}
                            onClick={loadUsers}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by email, name, company or role..."
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "13px 15px",
                            border: "1px solid #dfe4dc",
                            borderRadius: "9px",
                            outlineColor: "#718b76",
                            marginBottom: "20px",
                            fontSize: "14px",
                        }}
                    />

                    {loading ? (
                        <p style={styles.muted}>Loading registered accounts...</p>
                    ) : filteredUsers.length === 0 ? (
                        <p style={styles.muted}>
                            No matching accounts found.
                        </p>
                    ) : (
                        <div style={styles.tableWrap}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={{ background: "#f7f8f3" }}>
                                        {["Account", "Name", "Role", "Status", "Action"].map(
                                            (heading) => (
                                                <th
                                                    key={heading}
                                                    style={{
                                                        ...styles.cell,
                                                        color: "#68786c",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {heading}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td style={styles.cell}>
                                                <strong>{user.email || "No email"}</strong>
                                                <div style={styles.muted}>
                                                    @{user.username}
                                                </div>
                                            </td>

                                            <td style={styles.cell}>
                                                {user.full_name || "—"}
                                                {user.company && (
                                                    <div style={styles.muted}>
                                                        {user.company}
                                                    </div>
                                                )}
                                            </td>

                                            <td style={styles.cell}>
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "5px 9px",
                                                        borderRadius: "20px",
                                                        background:
                                                            user.role === "recruiter"
                                                                ? "#edf2e8"
                                                                : "#f0f0e9",
                                                        color: "#405b48",
                                                        fontSize: "12px",
                                                        textTransform: "capitalize",
                                                    }}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td style={styles.cell}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </td>

                                            <td style={styles.cell}>
                                                <button
                                                    style={styles.danger}
                                                    onClick={() => handleDelete(user)}
                                                    disabled={deletingId === user.id}
                                                >
                                                    {deletingId === user.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <p
                    style={{
                        ...styles.muted,
                        textAlign: "center",
                        marginTop: "28px",
                    }}
                >
                    Nexora Administration · Secure account management
                </p>
            </div>
        </main>
    );
}

export default AdminDashboard;
