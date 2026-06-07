import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from "@/context/AuthProvider";
import { useNavigate } from "react-router-dom"; // Added missing navigate hook
import BottomBar from "@/components/BottomBar";
import TopHeader from "@/components/TopHeader";
import { Avatar, Badge } from "@mui/material";
import Invite from "@/components/Invite";
import Footer from '@/components/Footer';
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined"

function EditAccountPage() {
    const { profile, user, handleUpdate, setError, error } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // 2. Dedicated Password States (Keep these isolated from profile table objects)
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [profilePicture, setProfilePicture] = useState("");
    const fileInputRef = useRef(null);

    const handleAvatarClick = () => {
        // Triggers the hidden file input when the avatar is clicked
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                // Create a canvas to resize/compress the image
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 350; // Ideal size for a profile avatar
                const MAX_HEIGHT = 350;
                let width = img.width;
                let height = img.height;

                // Maintain aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to Base64 webp or jpeg with compression quality (0.7 = 70% quality)
                // This drastically shortens the final Base64 string length
                const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.7);

                // Set your state with the shortened Base64 string
                setProfilePicture(optimizedBase64);
                console.log("Optimized Base64 Length:", optimizedBase64.length);
            };
        };
    };
    // 3. Populate fields ONLY when the profile finishes loading for the first time
    useEffect(() => {
        if (profile && user) {
            setUsername(profile.username || "");
            setFullName(profile.full_name || "");
            setEmail(user.email || "");
            setPhone(profile.phone || "");
        }
    }, [profile, user]); // Run only on initial mount or when fresh DB records load syncs

    const onSaveChanges = async (e) => {
        e.preventDefault();

        // Security Validation: If they typed a new password, verify it matches the confirmation
        if (newPassword || confirmNewPassword) {
            if (newPassword !== confirmNewPassword) {
                setError([true, 'pwmatcherror', "New passwords do not match!"]);
                return;
            }
        }

        // Pass clean values directly to your context controller function
        await handleUpdate(email, newPassword, username, fullName, phone, profilePicture);

        // Clear passwords fields on successful update
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
    };

    return (
        <div className="container-xxl">
            <TopHeader profile={profile} />

            <section>
                <div>
                    <span
                        className="p-2 w-auto"
                        role="button"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-left"></i> &nbsp; Back
                    </span>
                </div>

                <div className="d-flex flex-column mt-3 gap-4">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
                        <div className="w-100">
                            <h3 className="fw-bold mb-1 text-center">Edit Account</h3>
                            <p className="text-muted mb-0 small text-center">
                                Update your profile information and account settings here.
                            </p>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 p-4 mb-4">
                        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                            <div className='d-flex flex-column align-items-center justify-content-center'>
                                <Badge
                                    variant="dot"
                                    color="success"
                                    overlap="circular"
                                    badgeContent=" "
                                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                    sx={{
                                        "& .MuiBadge-dot": {
                                            height: 15,
                                            width: 15,
                                            borderRadius: "50%",
                                        },
                                    }}
                                >
                                    {/* Clickable Avatar */}
                                    <Avatar
                                        className="border m-auto shadow-sm border-2 border-primary"
                                        sx={{
                                            width: 72,
                                            height: 72,
                                            fontSize: "1.75rem",
                                            cursor: "pointer", // Gives the user a visual cue it's clickable
                                            '&:hover': { opacity: 0.8 } // Nice hover effect
                                        }}
                                        // Fallback to the newly uploaded profilePicture if it exists
                                        src={profilePicture || profile?.avatar_url}
                                        onClick={handleAvatarClick}
                                    />
                                </Badge>

                                <div role='button' className='position-relative d-flex flex-column justify-content-center cursor-pointer'>
                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        style={{ opacity: '0', zIndex: 3, cursor: 'pointer' }}
                                        className='w-100 h-100 border position-absolute'
                                    />
                                    <div className='bg-primary mt-3 m-auto rounded-2 p-2 px-3 small text-light'>
                                        <ImageOutlinedIcon fontSize='small' /> Update Picture
                                    </div>
                                </div>

                            </div>
                            <div>
                                <h4 className="mb-2">
                                    {profile?.full_name || profile?.username || "Unknown"} (You)
                                </h4>
                                <div className="small mb-2 text-primary">
                                    @{profile?.username || "Unknown"}
                                </div>
                                <div className="small text-muted">
                                    {profile?.gender || "Not specified"} |{" "}
                                    {profile?.age_group?.toUpperCase() || "N/A"}
                                </div>
                            </div>
                        </div>

                        <div className="row gy-3">
                            {/* USERNAME */}
                            <div className="col-12 col-md-6">
                                <div className="p-3 rounded-3 border" style={{ background: "#f7f2ff" }}>
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i className="bi bi-person" style={{ color: "#6A0DAD" }}></i> User Name
                                    </div>
                                    <div className="input-group">
                                        <span className="input-group-text">@</span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {
                                    error[0] && (error[1] === 'username_taken' || error[1] === 'usernametaken') && (
                                        <div className="text-danger small mt-1">
                                            {error[2]}
                                        </div>
                                    )
                                }
                            </div>

                            {/* FULL NAME */}
                            <div className="col-12 col-md-6">
                                <div className="p-3 rounded-3 border" style={{ background: "#f7f2ff" }}>
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i className="bi bi-person" style={{ color: "#6A0DAD" }}></i> Full Name
                                    </div>
                                    <input
                                        type="text"
                                        className='w-100 form-control'
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* EMAIL */}
                            <div className="col-12 col-md-6">
                                <div className="p-3 rounded-3 border" style={{ background: "#f7f2ff" }}>
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i className="bi bi-envelope" style={{ color: "#6A0DAD" }}></i> Email
                                    </div>
                                    <input
                                        type="email"
                                        className='w-100 form-control'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* PHONE */}
                            <div className="col-12 col-md-6">
                                <div className="p-3 rounded-3 border" style={{ background: "#f7f2ff" }}>
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i className="bi bi-phone" style={{ color: "#6A0DAD" }}></i> Phone
                                    </div>
                                    <input
                                        type="text"
                                        className='w-100 form-control'
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* OLD PASSWORD */}
                            <div className="col-12 col-md-6">
                                <div className="p-3 rounded-3 border" style={{ background: "#f7f2ff" }}>
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i className="bi bi-key" style={{ color: "#6A0DAD" }}></i> Old Password
                                    </div>
                                    <input
                                        className='w-100 form-control'
                                        type="password"
                                        placeholder="••••••••"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* NEW PASSWORD */}
                            <div className="col-12 col-md-6">
                                <div className="p-3 rounded-3 border" style={{ background: "#f7f2ff" }}>
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i className="bi bi-eye-slash" style={{ color: "#6A0DAD" }}></i> New Password
                                    </div>
                                    <input
                                        className='w-100 form-control'
                                        type="password"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* CONFIRM NEW PASSWORD */}
                            <div className="col-12 col-md-6">
                                <div className="p-3 rounded-3 border" style={{ background: "#f7f2ff" }}>
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i className="bi bi-eye-slash" style={{ color: "#6A0DAD" }}></i> Confirm New Password
                                    </div>
                                    <input
                                        className='w-100 form-control'
                                        type="password"
                                        placeholder="Repeat new password"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    />
                                </div>
                                {
                                    error[0] && error[1] === 'pwmatcherror' && (
                                        <div className="text-danger small mt-1">
                                            {error[2]}
                                        </div>
                                    )
                                }
                            </div>

                            {
                                error[0] && error[1] === 'update_failed' && (
                                    <div className="col-12">
                                        <div className="alert alert-danger" role="alert">
                                            {error[2]}
                                        </div>
                                    </div>
                                )
                            }

                            {/* SUBMIT BUTTON */}
                            <div className="col-12">
                                <button
                                    className="btn btn-primary w-100"
                                    type='button'
                                    onClick={onSaveChanges}
                                    style={{
                                        background: "linear-gradient(135deg, #6a0dad 0%, #392b8d 65%, #1f1a4b 100%)",
                                    }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <Invite profile={profile} />
            </section>
            <BottomBar currentPage={3} />
            <Footer />
        </div>
    );
}

export default EditAccountPage;