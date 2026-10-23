
import axios from "axios";

// =========================
// API INSTANCES
// =========================

// Authentication, profile, education, skills, experience, and skill gap
const API = axios.create({
    baseURL: "/api/auth/",
    headers: {
        "Content-Type": "application/json",
    },
});

// Resume APIs
const RESUME_API = axios.create({
    baseURL: "/api/resumes/",
});

// Jobs and applications APIs
const JOBS_API = axios.create({
    baseURL: "/api/jobs/",
    headers: {
        "Content-Type": "application/json",
    },
});

// Interview practice APIs
const INTERVIEW_API = axios.create({
    baseURL: "/api/interviews/",
    headers: {
        "Content-Type": "application/json",
    },
});

// =========================
// AUTHENTICATION
// =========================

export const registerUser = async (userData) => {
    const response = await API.post("register/", userData);
    return response.data;
};

export const loginUser = async (userData) => {
    const response = await API.post("login/", userData);

    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);

    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
};

// =========================
// PROFILE
// =========================

export const getProfile = async () => {
    const token = localStorage.getItem("access_token");

    const response = await API.get("profile/", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const updateProfile = async (profileData) => {
    const token = localStorage.getItem("access_token");

    const response = await API.put("profile/", profileData, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

// =========================
// EDUCATION
// =========================

export const getEducation = async () => {
    const token = localStorage.getItem("access_token");

    const response = await API.get("education/", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const addEducation = async (educationData) => {
    const token = localStorage.getItem("access_token");

    const response = await API.post("education/", educationData, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const deleteEducation = async (id) => {
    const token = localStorage.getItem("access_token");

    await API.delete(`education/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// =========================
// SKILLS
// =========================

export const getSkills = async () => {
    const token = localStorage.getItem("access_token");

    const response = await API.get("skills/", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const addSkill = async (skillData) => {
    const token = localStorage.getItem("access_token");

    const response = await API.post("skills/", skillData, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const deleteSkill = async (id) => {
    const token = localStorage.getItem("access_token");

    await API.delete(`skills/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// =========================
// EXPERIENCE
// =========================

export const getExperience = async () => {
    const token = localStorage.getItem("access_token");

    const response = await API.get("experience/", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const addExperience = async (experienceData) => {
    const token = localStorage.getItem("access_token");

    const response = await API.post("experience/", experienceData, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const deleteExperience = async (id) => {
    const token = localStorage.getItem("access_token");

    await API.delete(`experience/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// =========================
// RESUME
// =========================

export const getResumes = async () => {
    const token = localStorage.getItem("access_token");

    const response = await RESUME_API.get("", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const uploadResume = async (resumeData) => {
    const token = localStorage.getItem("access_token");

    const response = await RESUME_API.post("", resumeData, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const deleteResume = async (id) => {
    const token = localStorage.getItem("access_token");

    await RESUME_API.delete(`${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// =========================
// RESUME ANALYSIS
// =========================

export const getResumeAnalysis = async (id) => {
    const token = localStorage.getItem("access_token");

    const response = await RESUME_API.get(`${id}/analysis/`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

// =========================
// SKILL GAP
// =========================

export const createSkillGap = async (skillGapData) => {
    const token = localStorage.getItem("access_token");

    const response = await API.post("skill-gap/", skillGapData, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

// =========================
// JOBS
// =========================

export const getJobs = async (params = {}) => {
    const response = await JOBS_API.get("", { params });
    return response.data;
};

export const getJobDetails = async (jobId) => {
    const response = await JOBS_API.get(`${jobId}/`);
    return response.data;
};

// =========================
// JOB APPLICATIONS
// =========================

export const applyForJob = async (jobId, coverLetter = "") => {
    const token = localStorage.getItem("access_token");

    const response = await JOBS_API.post(
        "apply/",
        {
            job: jobId,
            cover_letter: coverLetter,
        },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    return response.data;
};

export const getMyApplications = async () => {
    const token = localStorage.getItem("access_token");

    const response = await JOBS_API.get("my-applications/", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

// =========================
// AI INTERVIEW PRACTICE
// =========================

export const getInterviews = async () => {
    const token = localStorage.getItem("access_token");

    const response = await INTERVIEW_API.get("", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const createInterview = async (interviewType) => {
    const token = localStorage.getItem("access_token");

    const response = await INTERVIEW_API.post(
        "",
        {
            interview_type: interviewType,
            total_questions: 5,
        },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    return response.data;
};

export const getInterviewDetails = async (interviewId) => {
    const token = localStorage.getItem("access_token");

    const response = await INTERVIEW_API.get(`${interviewId}/`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

export const submitInterviewAnswer = async (
    interviewId,
    question,
    answer
) => {
    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

    const response = await INTERVIEW_API.post(
        `${interviewId}/answers/`,
        {
            question,
            answer,
        },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    return response.data;
};

// =========================
// AI INTERVIEW HISTORY
// =========================

export const getInterviewHistory = async () => {
    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

    const response = await INTERVIEW_API.get("history/", {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
};

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

