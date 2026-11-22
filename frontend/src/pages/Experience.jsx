import { useEffect, useState } from "react";

import {
    getExperience,
    addExperience,
    deleteExperience
} from "../services/api";
import "./Experience.css";

function Experience() {
    const [experience, setExperience] = useState([]);

    const emptyForm = {
        company: "",
        job_title: "",
        start_date: "",
        end_date: "",
        currently_working: false,
        description: "",
    };

    const [formData, setFormData] = useState(emptyForm);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadExperience();
    }, []);

    const loadExperience = async () => {
        try {
            const data = await getExperience();
            setExperience(data);
        } catch (error) {
            console.error("Unable to load experience:", error.response?.data || error);
            setMessage("Unable to load experience.");
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        // Django REST Framework DateField accepts null for an empty optional date,
        // but an empty string ("") is not a valid date.
        const payload = {
            ...formData,
            end_date: formData.currently_working
                ? null
                : (formData.end_date || null),
        };

        try {
            await addExperience(payload);
            setMessage("Experience added successfully!");
            setFormData(emptyForm);
            await loadExperience();
        } catch (error) {
            console.error(
                "Experience API error:",
                error.response?.data || error
            );

            const data = error.response?.data;
            if (data && typeof data === "object") {
                const firstError = Object.entries(data)
                    .map(([field, errors]) => {
                        const detail = Array.isArray(errors)
                            ? errors.join(" ")
                            : String(errors);
                        return `${field}: ${detail}`;
                    })
                    .join(" ");
                setMessage(firstError || "Failed to add experience. Please check the entered details.");
            } else {
                setMessage("Failed to add experience. Please try again.");
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteExperience(id);
            setMessage("Experience deleted successfully!");
            await loadExperience();
        } catch (error) {
            console.error("Experience delete API error:", error.response?.data || error);
            setMessage("Failed to delete experience.");
        }
    };

    return (
        <div className="experience-page">
            <div className="experience-container">
                <div className="experience-header">
                    <h1>Nexora</h1>
                    <h2>Experience</h2>
                    <p>Add your professional experience.</p>
                </div>

                <form className="experience-form" onSubmit={handleSubmit}>
                    <div className="experience-grid">
                        <div className="experience-input">
                            <label htmlFor="company">Company</label>
                            <input
                                id="company"
                                type="text"
                                name="company"
                                placeholder="Company name"
                                value={formData.company}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="experience-input">
                            <label htmlFor="job_title">Job Title</label>
                            <input
                                id="job_title"
                                type="text"
                                name="job_title"
                                placeholder="e.g. Software Developer"
                                value={formData.job_title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="experience-input">
                            <label htmlFor="start_date">Start Date</label>
                            <input
                                id="start_date"
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="experience-input">
                            <label htmlFor="end_date">End Date</label>
                            <input
                                id="end_date"
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                disabled={formData.currently_working}
                            />
                        </div>
                    </div>

                    <div className="working-checkbox">
                        <input
                            id="currently_working"
                            type="checkbox"
                            name="currently_working"
                            checked={formData.currently_working}
                            onChange={handleChange}
                        />
                        <label htmlFor="currently_working">I currently work here</label>
                    </div>

                    <div className="experience-input">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Describe your responsibilities and achievements..."
                            value={formData.description}
                            onChange={handleChange}
                            rows="5"
                        />
                    </div>

                    <button type="submit" className="add-experience-button">
                        Add Experience
                    </button>
                </form>

                {message && (
                    <p className="experience-message" role="status">
                        {message}
                    </p>
                )}

                <div className="experience-list">
                    <h2>Your Experience</h2>

                    {experience.length === 0 ? (
                        <p className="empty-experience">No experience added yet.</p>
                    ) : (
                        experience.map((item) => (
                            <div className="experience-card" key={item.id}>
                                <div>
                                    <h3>{item.job_title}</h3>
                                    <h4>{item.company}</h4>
                                    <p>
                                        {item.start_date}
                                        {" - "}
                                        {item.currently_working ? "Present" : (item.end_date || "Not specified")}
                                    </p>
                                    <p>{item.description}</p>
                                </div>

                                <button
                                    type="button"
                                    className="delete-experience-button"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default Experience;
