import { useEffect, useState } from "react";
import {
    getSkills,
    addSkill,
    deleteSkill
} from "../services/api";
import "./Skills.css";

function Skills() {

    const [skills, setSkills] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        level: "Beginner",
    });

    const [message, setMessage] = useState("");

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {

        try {

            const data = await getSkills();

            setSkills(data);

        } catch (error) {

            console.log(error);
            setMessage("Unable to load skills.");

        }
    };

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addSkill(formData);

            setMessage("Skill added successfully!");

            setFormData({
                name: "",
                level: "Beginner",
            });

            loadSkills();

        } catch (error) {

            console.log(error);
            setMessage("Failed to add skill.");

        }
    };

    const handleDelete = async (id) => {

        try {

            await deleteSkill(id);

            setMessage("Skill deleted successfully!");

            loadSkills();

        } catch (error) {

            console.log(error);
            setMessage("Failed to delete skill.");

        }
    };

    return (
      <>
    

    <div className="skills-page">

            <div className="skills-container">

                <div className="skills-header">

                    <h1>Nexora</h1>

                    <h2>Skills</h2>

                    <p>
                        Add the skills you currently have.
                    </p>

                </div>

                <form
                    className="skills-form"
                    onSubmit={handleSubmit}
                >

                    <div className="skill-input">

                        <label>
                            Skill Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            placeholder="e.g. Python"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="skill-input">

                        <label>
                            Skill Level
                        </label>

                        <select
                            name="level"
                            value={formData.level}
                            onChange={handleChange}
                        >

                            <option value="Beginner">
                                Beginner
                            </option>

                            <option value="Intermediate">
                                Intermediate
                            </option>

                            <option value="Advanced">
                                Advanced
                            </option>

                        </select>

                    </div>

                    <button
                        type="submit"
                        className="add-skill-button"
                    >
                        Add Skill
                    </button>

                </form>

                {message && (
                    <p className="skills-message">
                        {message}
                    </p>
                )}

                <div className="skills-list">

                    <h2>
                        Your Skills
                    </h2>

                    {skills.length === 0 ? (

                        <p className="empty-skills">
                            No skills added yet.
                        </p>

                    ) : (

                        <div className="skill-cards">

                            {skills.map((skill) => (

                                <div
                                    className="skill-card"
                                    key={skill.id}
                                >

                                    <div>

                                        <h3>
                                            {skill.name}
                                        </h3>

                                        <span>
                                            {skill.level}
                                        </span>

                                    </div>

                                    <button
                                        className="delete-skill-button"
                                        onClick={() =>
                                            handleDelete(skill.id)
                                        }
                                    >
                                        Delete
                                    </button>

                                </div>

                            ))}

                        </div>

                    )}

                </div>

            </div>

        </div>
        
</>
    );
}

export default Skills;
