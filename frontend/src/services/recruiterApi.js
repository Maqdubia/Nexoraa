import axios from "axios";

const recruiterAPI = axios.create({
    baseURL: "/api/jobs/hr/",
    headers: {
        "Content-Type": "application/json",
    },
});

const authHeaders = () => {
    const token = localStorage.getItem("access_token");

    return {
        Authorization: `Bearer ${token}`,
    };
};

export const getCurrentUser = async () => {
    const response = await axios.get("/api/auth/me/", {
        headers: authHeaders(),
    });

    return response.data;
};

export const getRecruiterJobs = async () => {
    const response = await recruiterAPI.get("jobs/", {
        headers: authHeaders(),
    });

    return response.data;
};

export const createRecruiterJob = async (jobData) => {
    const response = await recruiterAPI.post("jobs/", jobData, {
        headers: authHeaders(),
    });

    return response.data;
};

export const updateRecruiterJob = async (id, jobData) => {
    const response = await recruiterAPI.patch(
        `jobs/${id}/`,
        jobData,
        { headers: authHeaders() }
    );

    return response.data;
};

export const deleteRecruiterJob = async (id) => {
    const response = await recruiterAPI.delete(`jobs/${id}/`, {
        headers: authHeaders(),
    });

    return response.data;
};

export const getRecruiterApplications = async () => {
    const response = await recruiterAPI.get("applications/", {
        headers: authHeaders(),
    });

    return response.data;
};


export const createHRAccount = async (accountData) => {
    const response = await axios.post(
        "/api/jobs/hr/accounts/",
        accountData,
        { headers: authHeaders() }
    );

    return response.data;
};
