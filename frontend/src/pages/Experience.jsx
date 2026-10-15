
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
    getExperience,
    addExperience,
    deleteExperience
} from "../services/api";
import "./Experience.css";

function Experience() {

    const [experience, setExperience] = useState([]);

    const [formData, setFormData] = useState({
        company: "",
        job_title: "",
        start_date: "",
        end_date: "",
        currently_working: false,
        description: "",
    });

    const [message, setMessage] = useState("");

    useEffect(() => {
        loadExperience();
    }, []);

    const loadExperience = async () => {

        try {

            const data = await getExperience();

            setExperience(data);

        } catch (error) {

            console.log(error);
            setMessage("Unable to load experience.");

        }
    };

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addExperience(formData);

            setMessage("Experience added successfully!");

            setFormData({
                company: "",
                job_title: "",
                start_date: "",
                end_date: "",
                currently_working: false,
                description: "",
            });

            loadExperience();

        } catch (error) {

            console.log(error);
            setMessage("Failed to add experience.");

        }
    };

    const handleDelete = async (id) => {

        try {

            await deleteExperience(id);

            setMessage("Experience deleted successfully!");

            loadExperience();

        } catch (error) {

            console.log(error);
            setMessage("Failed to delete experience.");

        }
    };

    return (
      <>
    <Navbar />

    <div className="experience-page">

            <div className="experience-container">

                <div className="experience-header">

                    <h1>Nexora</h1>

                    <h2>Experience</h2>

                    <p>
                        Add your professional experience.
                    </p>

                </div>

                <form
                    className="experience-form"
                    onSubmit={handleSubmit}
                >

                    <div className="experience-grid">

                        <div className="experience-input">

                            <label>
                                Company
                            </label>

                            <input
                                type="text"
                                name="company"
                                placeholder="Company name"
                                value={formData.company}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="experience-input">

                            <label>
                                Job Title
                            </label>

                            <input
                                type="text"
                                name="job_title"
                                placeholder="e.g. Software Developer"
                                value={formData.job_title}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="experience-input">

                            <label>
                                Start Date
                            </label>

                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="experience-input">

                            <label>
                                End Date
                            </label>

                            <input
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
                            type="checkbox"
                            name="currently_working"
                            checked={formData.currently_working}
                            onChange={handleChange}
                        />

                        <label>
                            I currently work here
                        </label>

                    </div>

                    <div className="experience-input">

                        <label>
                            Description
                        </label>

                        <textarea
                            name="description"
                            placeholder="Describe your responsibilities and achievements..."
                            value={formData.description}
                            onChange={handleChange}
                            rows="5"
                        />

                    </div>

                    <button
                        type="submit"
                        className="add-experience-button"
                    >
                        Add Experience
                    </button>

                </form>

                {message && (
                    <p className="experience-message">
                        {message}
                    </p>
                )}

                <div className="experience-list">

                    <h2>
                        Your Experience
                    </h2>

                    {experience.length === 0 ? (

                        <p className="empty-experience">
                            No experience added yet.
                        </p>

                    ) : (

                        experience.map((item) => (

                            <div
                                className="experience-card"
                                key={item.id}
                            >

                                <div>

                                    <h3>
                                        {item.job_title}
                                    </h3>

                                    <h4>
                                        {item.company}
                                    </h4>

                                    <p>
                                        {item.start_date}
                                        {" - "}
                                        {item.currently_working
                                            ? "Present"
                                            : item.end_date}
                                    </p>

                                    <p>
                                        {item.description}
                                    </p>

                                </div>

                                <button
                                    className="delete-experience-button"
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

export default Experience;