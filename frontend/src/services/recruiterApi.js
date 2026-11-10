import axios from "axios";

// One client for all recruiter calls. It adds the login token to every
// request and sends the person back to the recruiter login if the session
// has expired.
const client = axios.create({
    baseURL: "/api/",
    headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || "";

        if (error.response?.status === 401 && url !== "auth/me/") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            if (!window.location.pathname.startsWith("/login")) {
                window.location.assign("/login");
            }
        }

        return Promise.reject(error);
    }
);

export const getCurrentUser = async () => {
    const response = await client.get("auth/me/");
    return response.data;
};

// ---------- Jobs ----------
export const getRecruiterJobs = async () => {
    const response = await client.get("jobs/hr/jobs/");
    return response.data;
};

export const createRecruiterJob = async (jobData) => {
    const response = await client.post("jobs/hr/jobs/", jobData);
    return response.data;
};

export const updateRecruiterJob = async (id, jobData) => {
    const response = await client.patch(`jobs/hr/jobs/${id}/`, jobData);
    return response.data;
};

export const deleteRecruiterJob = async (id) => {
    const response = await client.delete(`jobs/hr/jobs/${id}/`);
    return response.data;
};

// ---------- Candidates / applications ----------
export const getRecruiterApplications = async (jobId) => {
    const response = await client.get("jobs/hr/applications/", {
        params: jobId ? { job: jobId } : {},
    });
    return response.data;
};

export const getApplicationDetail = async (id) => {
    const response = await client.get(`jobs/hr/applications/${id}/`);
    return response.data;
};

export const updateApplicationStatus = async (id, status) => {
    const response = await client.patch(`jobs/hr/applications/${id}/`, {
        status,
    });
    return response.data;
};

export const bulkUpdateStatus = async (ids, status) => {
    const response = await client.post("jobs/hr/applications/bulk-status/", {
        ids,
        status,
    });
    return response.data;
};

export const getRecruiterStats = async () => {
    const response = await client.get("jobs/hr/stats/");
    return response.data;
};

// ---------- Admin ----------
export const createHRAccount = async (accountData) => {
    const response = await client.post("jobs/hr/accounts/", accountData);
    return response.data;
};
