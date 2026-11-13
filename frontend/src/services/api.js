
import axios from "axios";

// =====================================================
// API INSTANCES
// =====================================================

const API = axios.create({
    baseURL: "/api/auth/",
    headers: { "Content-Type": "application/json" },
});

const RESUME_API = axios.create({
    baseURL: "/api/resumes/",
});

const JOBS_API = axios.create({
    baseURL: "/api/jobs/",
    headers: { "Content-Type": "application/json" },
});

const INTERVIEW_API = axios.create({
    baseURL: "/api/interviews/",
    headers: { "Content-Type": "application/json" },
});

const API_INSTANCES = [API, RESUME_API, JOBS_API, INTERVIEW_API];

// =====================================================
// JWT TOKEN REFRESH
// =====================================================

let refreshPromise = null;

const getAccessToken = () =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("access");

const clearAuthTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
};

const refreshAccessToken = async () => {
    const refreshToken =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("refresh");

    if (!refreshToken) {
        throw new Error("No refresh token available. Please log in again.");
    }

    if (!refreshPromise) {
        refreshPromise = axios
            .post("/api/auth/refresh/", {
                refresh: refreshToken,
            })
            .then((response) => {
                const newAccessToken = response.data.access;

                if (!newAccessToken) {
                    throw new Error("Token refresh returned no access token.");
                }

                localStorage.setItem("access_token", newAccessToken);

                // Store a rotated refresh token if the backend returns one.
                if (response.data.refresh) {
                    localStorage.setItem(
                        "refresh_token",
                        response.data.refresh
                    );
                }

                return newAccessToken;
            })
            .catch((error) => {
                clearAuthTokens();
                throw error;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

// Attach the latest access token to every API request.
API_INSTANCES.forEach((instance) => {
    instance.interceptors.request.use(
        (config) => {
            const token = getAccessToken();

            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        },
        (error) => Promise.reject(error)
    );
});

// Automatically refresh expired tokens and retry the failed request.
API_INSTANCES.forEach((instance) => {
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (
                error.response?.status !== 401 ||
                !originalRequest ||
                originalRequest._retry ||
                originalRequest.url?.includes("refresh/") ||
                originalRequest.url?.includes("login/") ||
                originalRequest.url?.includes("google/") ||
                originalRequest.url?.includes("register/") ||
                originalRequest.url?.includes("verify-email-otp/")
            ) {
                return Promise.reject(error);
            }

            // Do not attempt refresh if the user has no stored token.
            if (!getAccessToken()) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                const newAccessToken = await refreshAccessToken();

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                return instance(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }
    );
});

// =====================================================
// AUTHENTICATION
// =====================================================

export const registerUser = async (userData) => {
    const response = await API.post("register/", userData);
    return response.data;
};

export const verifyEmailOTP = async (email, otp) => {
    const response = await API.post("verify-email-otp/", {
        email: email.trim().toLowerCase(),
        otp: String(otp).trim(),
    });

    return response.data;
};

export const loginUser = async (userData) => {
    const response = await API.post("login/", {
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
    });

    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);

    return response.data;
};

export const googleLogin = async (credential) => {
    const response = await API.post("google/", { credential });

    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);

    return response.data;
};

export const getCurrentUser = async () => {
    const response = await API.get("me/");
    return response.data;
};

export const logoutUser = () => {
    clearAuthTokens();
};

// =====================================================
// PROFILE
// =====================================================

export const getProfile = async () => {
    const response = await API.get("profile/");
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await API.put("profile/", profileData);
    return response.data;
};

// =====================================================
// EDUCATION
// =====================================================

export const getEducation = async () => {
    const response = await API.get("education/");
    return response.data;
};

export const addEducation = async (educationData) => {
    const response = await API.post("education/", educationData);
    return response.data;
};

export const deleteEducation = async (id) => {
    await API.delete(`education/${id}/`);
};

// =====================================================
// SKILLS
// =====================================================

export const getSkills = async () => {
    const response = await API.get("skills/");
    return response.data;
};

export const addSkill = async (skillData) => {
    const response = await API.post("skills/", skillData);
    return response.data;
};

export const deleteSkill = async (id) => {
    await API.delete(`skills/${id}/`);
};

// =====================================================
// EXPERIENCE
// =====================================================

export const getExperience = async () => {
    const response = await API.get("experience/");
    return response.data;
};

export const addExperience = async (experienceData) => {
    const response = await API.post("experience/", experienceData);
    return response.data;
};

export const deleteExperience = async (id) => {
    await API.delete(`experience/${id}/`);
};

// =====================================================
// RESUME
// =====================================================

export const getResumes = async () => {
    const response = await RESUME_API.get("");
    return response.data;
};

export const uploadResume = async (resumeData) => {
    const response = await RESUME_API.post("", resumeData);
    return response.data;
};

export const deleteResume = async (id) => {
    await RESUME_API.delete(`${id}/`);
};

// =====================================================
// RESUME ANALYSIS
// =====================================================

export const getResumeAnalysis = async (id) => {
    const response = await RESUME_API.get(`${id}/analysis/`);
    return response.data;
};

// =====================================================
// SKILL GAP
// =====================================================

export const createSkillGap = async (skillGapData) => {
    const response = await API.post("skill-gap/", skillGapData);
    return response.data;
};

// =====================================================
// JOBS
// =====================================================

export const getJobs = async (params = {}) => {
    const response = await JOBS_API.get("", { params });
    return response.data;
};

export const getJobDetails = async (jobId) => {
    const response = await JOBS_API.get(`${jobId}/`);
    return response.data;
};

// =====================================================
// JOB APPLICATIONS
// =====================================================

export const applyForJob = async (jobId, coverLetter = "") => {
    const response = await JOBS_API.post("apply/", {
        job: jobId,
        cover_letter: coverLetter,
    });

    return response.data;
};

export const getMyApplications = async () => {
    const response = await JOBS_API.get("my-applications/");
    return response.data;
};

// =====================================================
// AI INTERVIEW PRACTICE
// =====================================================

export const getInterviews = async () => {
    const response = await INTERVIEW_API.get("");
    return response.data;
};

export const createInterview = async (interviewType) => {
    const response = await INTERVIEW_API.post("", {
        interview_type: interviewType,
        total_questions: 5,
    });

    return response.data;
};

export const getInterviewDetails = async (interviewId) => {
    const response = await INTERVIEW_API.get(`${interviewId}/`);
    return response.data;
};

export const submitInterviewAnswer = async (
    interviewId,
    question,
    answer
) => {
    const response = await INTERVIEW_API.post(
        `${interviewId}/answers/`,
        {
            question,
            answer,
        }
    );

    return response.data;
};

// =====================================================
// AI INTERVIEW HISTORY
// =====================================================

export const getInterviewHistory = async () => {
    const response = await INTERVIEW_API.get("history/");
    return response.data;
};

// =====================================================
// FORGOT PASSWORD / OTP
// =====================================================

export const requestPasswordResetOTP = async (email) => {
    const response = await API.post("forgot-password/", {
        email,
    });

    return response.data;
};

export const verifyPasswordResetOTP = async (email, otp) => {
    const response = await API.post("verify-reset-otp/", {
        email,
        otp,
    });

    return response.data;
};

export const resetPassword = async (email, resetToken, newPassword) => {
    const response = await API.post("reset-password/", {
        email,
        reset_token: resetToken,
        new_password: newPassword,
    });

    return response.data;
};

// =====================================================
// ADMIN USER MANAGEMENT
// =====================================================

export const getAdminUsers = async () => {
    const response = await API.get("admin/users/");
    return response.data;
};

export const deleteAdminUser = async (userId) => {
    const response = await API.delete(`admin/users/${userId}/`);
    return response.data;
};
