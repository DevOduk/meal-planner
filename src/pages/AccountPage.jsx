import React from 'react'
import { useAuth } from "@/context/AuthProvider";
import BottomBar from "@/components/BottomBar";
import TopHeader from "@/components/TopHeader";
import {
    Avatar,
    Badge,
} from "@mui/material";
import {
    DriveFileRenameOutline,
    LogoutOutlined,
} from "@mui/icons-material";
import Invite from "@/components/Invite";
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router';


function AccountPage() {
    const navigate = useNavigate();
    const { profile, handleSignOut, user } = useAuth();

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
                            <h3 className="fw-bold mb-1 text-center">Account</h3>
                            <p className="text-muted mb-0 small text-center">
                                Manage your profile and sign out from the app.
                            </p>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 p-4 mb-4">
                        <div className="d-flex align-items-center justify-content-between gap-3">
                            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                                <Badge
                                    variant="dot"
                                    color="success"
                                    overlap="circular"
                                    badgeContent=" "
                                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                    sx={{
                                        "& .MuiBadge-dot": {
                                            height: 15, // Default dot is 8px, standard is ~20px. 12px is the sweet spot.
                                            width: 15,
                                            borderRadius: "50%",
                                        },
                                    }}
                                >
                                    <Avatar
                                        className="border shadow-sm border-2 border-primary"
                                        sx={{
                                            // bgcolor: "#6A0DAD",
                                            width: 72,
                                            height: 72,
                                            fontSize: "1.75rem",
                                        }}
                                        src={profile?.avatar_url} />
                                </Badge>
                                <div>
                                    <h4 className="mb-1">
                                        {profile?.full_name || profile?.username || "Unknown"}
                                    </h4>
                                    <div className="small text-muted">
                                        {profile?.gender || "Not specified"} |{" "}
                                        {profile?.age_group.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <button className="outline-0 p-1 px-2 small text-primary d-flex gap-2 align-items-center rounded-2 border-1 border-primary" onClick={() => navigate("/account/edit")}>
                                <DriveFileRenameOutline /> Update
                            </button>
                        </div>

                        <div className="row gy-3">
                            <div className="col-12 col-md-6">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i
                                            className="bi bi-person"
                                            style={{ color: "#6A0DAD" }}
                                        ></i>{" "}
                                        User Name
                                    </div>
                                    <div className="fw-semibold small text-muted">
                                        @{profile?.username || "N/A"}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i
                                            className="bi bi-person"
                                            style={{ color: "#6A0DAD" }}
                                        ></i>{" "}
                                        Full Name
                                    </div>
                                    <div className="fw-semibold small text-dark">
                                        {profile?.full_name || "N/A"}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i
                                            className="bi bi-person"
                                            style={{ color: "#6A0DAD" }}
                                        ></i>{" "}
                                        User ID
                                    </div>
                                    <div className="fw-semibold small text-dark">
                                        {profile?.id || "N/A"}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i
                                            className="bi bi-wifi"
                                            style={{ color: "#6A0DAD" }}
                                        ></i>{" "}
                                        Status
                                    </div>
                                    <div className="fw-semibold small d-flex align-items-center gap-2 text-success">
                                        <div
                                            className="rounded-circle m-0 p-0 border-0"
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                background: "#33ff00",
                                            }}
                                        ></div>{" "}
                                        <div>Online</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i
                                            className="bi bi-calendar"
                                            style={{ color: "#6A0DAD" }}
                                        ></i>{" "}
                                        Date Joined
                                    </div>
                                    <div className="fw-semibold small text-dark">
                                        {user?.created_at
                                            ? new Date(user.created_at).toLocaleString()
                                            : "N/A"}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i
                                            className="bi bi-clock"
                                            style={{ color: "#6A0DAD" }}
                                        ></i>{" "}
                                        Last Sign In
                                    </div>
                                    <div className="fw-semibold small text-dark">
                                        {user?.last_sign_in_at
                                            ? new Date(
                                                user.last_sign_in_at,
                                            ).toLocaleString()
                                            : "N/A"}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i
                                            className="bi bi-envelope"
                                            style={{ color: "#6A0DAD" }}
                                        ></i>{" "}
                                        Email
                                    </div>
                                    <div className="fw-semibold small text-dark d-flex justify-content-between">
                                        {user?.email || "Not available"}{" "}
                                        {user?.user_metadata.email_verified ? (
                                            <span className="text-success">
                                                Verified <i className="bi bi-check2-circle"></i>
                                            </span>
                                        ) : (
                                            <span className="text-danger">
                                                Not verified <i className="bi bi-x"></i>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-uppercase small text-muted mb-2">
                                        <i
                                            className="bi bi-phone"
                                            style={{ color: "#6A0DAD" }}
                                        ></i>{" "}
                                        Phone
                                    </div>
                                    <div className="fw-semibold small text-dark d-flex justify-content-between">
                                        {profile?.phone || "Not available"}{" "}
                                        {profile?.identity_data?.phone_verified ? (
                                            <span className="text-success">
                                                Verified <i className="bi bi-check2-circle"></i>
                                            </span>
                                        ) : (
                                            <span className="text-danger">
                                                Not verified <i className="bi bi-x"></i>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12">
                                <div
                                    className="p-3 rounded-3 border"
                                    style={{ background: "#f7f2ff" }}
                                >
                                    <div className="text-danger mb-2">Logout</div>
                                    <div className="fw-semibold small text-dark d-flex justify-content-between align-items-center">
                                        Logout now (This will clear you current session. You
                                        will need to log in again.)
                                        <button
                                            className="btn text-danger bg-light shadow-sm"
                                            onClick={handleSignOut}
                                        >
                                            <LogoutOutlined />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Invite profile={profile} />
            </section>
            <BottomBar currentPage={3} />
            <Footer />
        </div>
    )
}

export default AccountPage
