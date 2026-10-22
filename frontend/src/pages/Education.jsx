
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
    getEducation,
    addEducation,
    deleteEducation,
} from "../services/api";
import "./Education.css";

function Education() {
    const emptyForm = {
        institution: "",
        degree: "",
        field_of_study: "",
        start_year: "",
        end_year: "",
        description: "",
    };

    const [education, setEducation] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadEducation();
    }, []);

    const loadEducation = async () => {
        try {
            const data = await getEducation();

            // Support either a list or Django REST Framework pagination.
            setEducation(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error(
                "Load education error:",
                error.response?.status,
                error.response?.data || error.message
            );
            setMessage("Unable to load education. Please check your login.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const payload = {
            institution: formData.institution.trim(),
            degree: formData.degree.trim(),
            field_of_study: formData.field_of_study.trim(),
            start_year: Number(formData.start_year),
            end_year: formData.end_year
                ? Number(formData.end_year)
                : null,
            description: formData.description.trim(),
        };

        if (
            !payload.institution ||
            !payload.degree ||
            !payload.start_year
        ) {
            setMessage("Please enter institution, degree, and start year.");
            return;
        }

        if (
            payload.end_year !== null &&
            payload.end_year < payload.start_year
        ) {
            setMessage("End year cannot be earlier than start year.");
            return;
        }

        setLoading(true);

        try {
            await addEducation(payload);

            setMessage("Education added successfully!");
            setFormData({ ...emptyForm });

            await loadEducation();
        } catch (error) {
            console.error(
                "Education save failed:",
                error.response?.status,
                error.response?.data || error.message
            );

            const status = error.response?.status;
            const data = error.response?.data;

            let details = "";

            if (data && typeof data === "object") {
                details = Object.entries(data)
                    .map(([field, errors]) => {
                        const text = Array.isArray(errors)
                            ? errors.join(", ")
                            : typeof errors === "object"
                            ? JSON.stringify(errors)
                            : String(errors);

                        return `${field}: ${text}`;
                    })
                    .join(" | ");
            } else {
                details = data || error.message || "Unknown error";
            }

            setMessage(
                `Failed to add education${status ? ` (HTTP ${status})` : ""}: ${details}`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setMessage("");

        try {
            await deleteEducation(id);
            setMessage("Education deleted successfully!");
            await loadEducation();
        } catch (error) {
            console.error(
                "Delete education error:",
                error.response?.status,
                error.response?.data || error.message
            );

            setMessage(
                `Failed to delete education: ${
                    JSON.stringify(error.response?.data) ||
                    error.message
                }`
            );
        }
    };

    return (
        <>
            <Navbar />

            <div className="education-page">
                <div className="education-container">
                    <div className="education-header">
                        <h1>Nexora</h1>
                        <h2>Education</h2>
                        <p>Add your educational background.</p>
                    </div>

                    <form
                        className="education-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="education-grid">
                            <div className="education-input">
                                <label htmlFor="institution">
                                    Institution
                                </label>
                                <input
                                    id="institution"
                                    type="text"
                                    name="institution"
                                    placeholder="College / University"
                                    value={formData.institution}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="education-input">
                                <label htmlFor="degree">Degree</label>
                                <input
                                    id="degree"
                                    type="text"
                                    name="degree"
                                    placeholder="e.g. MCA"
                                    value={formData.degree}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="education-input">
                                <label htmlFor="field_of_study">
                                    Field of Study
                                </label>
                                <input
                                    id="field_of_study"
                                    type="text"
                                    name="field_of_study"
                                    placeholder="e.g. Computer Science"
                                    value={formData.field_of_study}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="education-input">
                                <label htmlFor="start_year">
                                    Start Year
                                </label>
                                <input
                                    id="start_year"
                                    type="number"
                                    name="start_year"
                                    placeholder="2023"
                                    min="1900"
                                    max="2100"
                                    value={formData.start_year}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="education-input">
                                <label htmlFor="end_year">
                                    End Year
                                </label>
                                <input
                                    id="end_year"
                                    type="number"
                                    name="end_year"
                                    placeholder="2025"
                                    min="1900"
                                    max="2100"
                                    value={formData.end_year}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="education-input">
                            <label htmlFor="description">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Describe your education..."
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                            />
                        </div>

                        <button
                            type="submit"
                            className="add-button"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Add Education"}
                        </button>
                    </form>

               {message && (
    <p
        className={`education-message ${
            message.toLowerCase().includes("successfully")
                ? "success"
                : "error"
        }`}
        role="status"
    >
        {message}
    </p>
)}

                    <div className="education-list">
                        <h2>Your Education</h2>

                        {education.length === 0 ? (
                            <p className="empty-text">
                                No education added yet.
                            </p>
                        ) : (
                            education.map((item) => (
                                <div
                                    className="education-item"
                                    key={item.id}
                                >
                                    <div>
                                        <h3>{item.degree}</h3>
                                        <h4>{item.institution}</h4>
                                        <p>{item.field_of_study}</p>
                                        <p>
                                            {item.start_year} -{" "}
                                            {item.end_year || "Present"}
                                        </p>
                                        <p>{item.description}</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="delete-button"
                                        onClick={() =>
                                            handleDelete(item.id)
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Education;
