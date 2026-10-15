
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/api";
import "./Profile.css";

function Profile() {

    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        location: "",
        date_of_birth: "",
        bio: "",
    });

    const [message, setMessage] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getProfile();

            setFormData({
                full_name: data.full_name || "",
                phone: data.phone || "",
                location: data.location || "",
                date_of_birth: data.date_of_birth || "",
                bio: data.bio || "",
            });

        } catch (error) {
            console.log(error);
            setMessage("Unable to load profile.");
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
            await updateProfile(formData);
            setMessage("Profile updated successfully!");
        } catch (error) {
            console.log(error);
            setMessage("Profile update failed.");
        }
    };

    return (
        <div className="profile-page">

            {/* HEADER */}

            <div className="profile-title">
                <div>
                    <h1>My Profile</h1>

                    <p>
                        Manage your personal information and build
                        your professional profile.
                    </p>
                </div>

                <div className="profile-status">
                    <span className="status-dot"></span>
                    Profile
                </div>
            </div>


            {/* PROFILE CARD */}

            <div className="profile-card">

                {/* PROFILE HEADER */}

                <div className="profile-card-header">

                    <div className="profile-avatar">
                        {formData.full_name
                            ? formData.full_name.charAt(0).toUpperCase()
                            : "N"}
                    </div>

                    <div className="profile-user-info">

                        <h2>
                            {formData.full_name || "Your Name"}
                        </h2>

                        <p>
                            Complete your profile to get better
                            career recommendations.
                        </p>

                    </div>

                </div>


                {/* FORM */}

                <form onSubmit={handleSubmit}>

                    {/* PERSONAL INFORMATION */}

                    <div className="profile-section">

                        <div className="section-heading">
                            <div className="section-icon">
                                👤
                            </div>

                            <div>
                                <h3>Personal Information</h3>

                                <p>
                                    Add your basic personal details
                                </p>
                            </div>
                        </div>


                        <div className="profile-grid">

                            <div className="profile-input">

                                <label>Full Name</label>

                                <input
                                    type="text"
                                    name="full_name"
                                    placeholder="Enter your full name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="profile-input">

                                <label>Phone</label>

                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Enter your phone number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="profile-input">

                                <label>Location</label>

                                <input
                                    type="text"
                                    name="location"
                                    placeholder="City, State"
                                    value={formData.location}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="profile-input">

                                <label>Date of Birth</label>

                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                    </div>


                    {/* ABOUT ME */}

                    <div className="profile-section">

                        <div className="section-heading">

                            <div className="section-icon">
                                ✨
                            </div>

                            <div>
                                <h3>About Me</h3>

                                <p>
                                    Tell employers about yourself
                                </p>
                            </div>

                        </div>


                        <div className="profile-input">

                            <textarea
                                name="bio"
                                placeholder="Tell us about yourself, your career goals, interests and experience..."
                                value={formData.bio}
                                onChange={handleChange}
                                rows="6"
                            />

                            <small>
                                A good summary helps improve your career recommendations.
                            </small>

                        </div>

                    </div>


                    {/* ACTION */}

                    <div className="profile-actions">

                        <button
                            type="submit"
                            className="save-button"
                        >
                            Save Profile
                        </button>

                    </div>

                </form>


                {/* MESSAGE */}

                {message && (
                    <div
                        className={
                            message.includes("successfully")
                                ? "profile-message success"
                                : "profile-message error"
                        }
                    >
                        {message}
                    </div>
                )}

            </div>

        </div>
    );
}

export default Profile;