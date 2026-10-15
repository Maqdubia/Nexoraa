
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getResumes,
    uploadResume,
    deleteResume
} from "../services/api";

import Navbar from "../components/Navbar";
import "./Resume.css";

function Resume() {

    const [resumes, setResumes] = useState([]);

    const [title, setTitle] = useState("");

    const [file, setFile] = useState(null);

    const [message, setMessage] = useState("");

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {

        try {

            const data = await getResumes();

            setResumes(data);

        } catch (error) {

            console.log(error);

            setMessage("Unable to load resumes.");
        }
    };


    const handleFileChange = (e) => {

        setFile(e.target.files[0]);

    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!file) {

            setMessage("Please select a resume file.");

            return;
        }

        try {

            const formData = new FormData();

            formData.append(
                "title",
                title || "My Resume"
            );

            formData.append(
                "resume_file",
                file
            );

            await uploadResume(formData);

            setMessage(
                "Resume uploaded successfully!"
            );

            setTitle("");

            setFile(null);

            document.getElementById(
                "resume-file"
            ).value = "";

            loadResumes();

        } catch (error) {

            console.log(error);

            setMessage(
                "Resume upload failed."
            );
        }
    };


    const handleDelete = async (id) => {

        try {

            await deleteResume(id);

            setMessage(
                "Resume deleted successfully!"
            );

            loadResumes();

        } catch (error) {

            console.log(error);

            setMessage(
                "Failed to delete resume."
            );
        }
    };


    return (
        <>
            <Navbar />

            <div className="resume-page">

                <div className="resume-container">

                    <div className="resume-header">

                        <h1>My Resume</h1>

                        <p>
                            Upload your resume to use
                            Nexora's AI career features.
                        </p>

                    </div>


                    <div className="resume-upload-card">

                        <h2>Upload Resume</h2>

                        <form onSubmit={handleSubmit}>

                            <div className="resume-input">

                                <label>
                                    Resume Title
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. Software Developer Resume"
                                    value={title}
                                    onChange={(e) =>
                                        setTitle(e.target.value)
                                    }
                                />

                            </div>


                            <div className="resume-input">

                                <label>
                                    Select Resume
                                </label>

                                <input
                                    id="resume-file"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    required
                                />

                                <p className="file-info">
                                    Supported formats: PDF, DOC, DOCX
                                </p>

                            </div>


                            <button
                                type="submit"
                                className="upload-button"
                            >
                                Upload Resume
                            </button>

                        </form>

                    </div>


                    {message && (
                        <p className="resume-message">
                            {message}
                        </p>
                    )}


                    <div className="resume-list">

                        <h2>
                            My Resumes
                        </h2>


                        {resumes.length === 0 ? (

                            <p className="empty-resume">
                                No resumes uploaded yet.
                            </p>

                        ) : (

                            resumes.map((resume) => (

                                <div
                                    className="resume-card"
                                    key={resume.id}
                                >

                                    <div>

                                        <h3>
                                            {resume.title}
                                        </h3>

                                        <p>
                                            Uploaded:{" "}
                                            {new Date(
                                                resume.uploaded_at
                                            ).toLocaleDateString()}
                                        </p>

                                    </div>


                                    <div className="resume-actions">

                                        <Link
    to={`/resume/${resume.id}/analysis`}
    className="analyze-button"
>
    Analyze
</Link>
                                        <button
                                            className="delete-resume-button"
                                            onClick={() =>
                                                handleDelete(resume.id)
                                            }
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </div>

                            ))

                        )}

                    </div>

                </div>

            </div>
        </>
    );
}

export default Resume;