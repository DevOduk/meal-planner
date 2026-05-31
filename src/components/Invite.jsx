import { AddOutlined } from "@mui/icons-material";
import { Avatar, Badge, Input, TextField } from "@mui/material";
import {
  Alert,
  Backdrop,
  Box,
  Fade,
  Modal,
  Snackbar,
  Typography,
} from "@mui/material";
import { useState } from "react";
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/context/AuthProvider";
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

const others = [
  { name: "Alice", profile_pic: "alice.jpg" },
  { name: "Bob", profile_pic: "bob.jpg" },
  { name: "Charlie", profile_pic: "charlie.jpg" },
]; // Example number of other friends


const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 4,
  borderRadius: 4,
  p: 3,
};

const Invite = ({ profile }) => {
  const { user, friends, friendRequests, getFriendRequests, getFriends } = useAuth(); // Current logged-in user
  const [open, setOpen] = useState(false);
  const [error, setError] = useState([false, "", ""]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState(
    { type: '', message: '' }
  );

  const handleClose = () => setOpen(false);
  const others = [
    { name: "Alice", profile_pic: "alice.jpg" },
    { name: "Bob", profile_pic: "bob.jpg" },
    { name: "Charlie", profile_pic: "charlie.jpg" },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setStatusMessage({ type: '', message: '' });
    setSearchResult(null);

    // Query the profiles table for an exact or close match on the name
    const { data, error } = await supabase
      .from("planner_profiles")
      .select("id, full_name, username, avatar_url")
      .ilike("full_name", searchQuery.trim()) // Case-insensitive matching
      .not("id", "eq", user.id) // Prevent users from finding themselves
      .maybeSingle(); // Returns 1 object or null safely

    if (error) {
      setStatusMessage({ type: 'error', message: "An error occurred while searching." });
      return;
    }
    if (!data) {
      setStatusMessage({ type: 'error', message: "No user found with that name." });
    } else {
      setSearchResult(data);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;

    const { error } = await supabase
      .from("planner_friendships")
      .insert({
        sender_id: user.id,
        receiver_id: searchResult.id,
        status: "pending",
      });



    if (error) {
      if (error.code === "23505") {
        setStatusMessage({ type: 'error', message: "You have already sent a request to this person! Wait for them to accept." });
      } else {
        setStatusMessage({ type: 'error', message: "Failed to send friend request." });
      }
    } else {
      setStatusMessage({ type: 'success', message: `Friend request sent to @${searchResult.username}!` });
      setSearchResult(null);
      setSearchQuery("");
    }
  };

  const acceptRequest = async (friendshipId, senderId) => {
    try {
      // 1. Update the row status in Supabase to accepted
      const { error } = await supabase
        .from("planner_friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;

      // 2. Trigger global refetches from your Context to move the user seamlessly
      // from your "Requests" array into your "Friends" array
      if (user) {
        await Promise.all([
          getFriendRequests(user.id),
          getFriends(user.id)
        ]);
      }

      console.log("Friend request accepted successfully!");
    } catch (err) {
      console.error("Error accepting friend request:", err.message);
    }
  };

  return (
    <div className="card shadow-sm border-0 p-4 mb-4">
      <h5 className="fw-bold text-dark m-0 mb-3">Invite Friends</h5>
      <span className="fw-semibold mb-3 small text-secondary">
        Connect and share your meal plans with friends and family!
      </span>
      <div className="d-flex flex-wrap gap-3 align-items-center">
        {/* you  */}
        {profile && <Badge
          variant="dot"
          color="success"
          overlap="circular"
          badgeContent=" "
          sx={{
            "& .MuiBadge-dot": {
              height: 15, // Default dot is 8px, standard is ~20px. 12px is the sweet spot.
              width: 15,
              borderRadius: "50%",
            },
          }}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <div className="d-flex flex-column align-items-center gap-1">
            <Avatar
              style={{ width: 70, height: 70 }}
              alt={profile?.username}
              src={profile?.avatar_url}
              title={`${profile?.username} (You)`}
              className="border shadow-sm border-2 border-primary"
            />
            <p className="m-0 text-center small mt-2 fw-semibold">@{profile?.username} (You)</p>

          </div>
        </Badge>}

        {friends.map((friend, index) => (
          <div key={index} className="d-flex flex-column align-items-center gap-1">
            <Avatar
              title={friend.username}
              src={friend.avatar}
              key={index}
              style={{ width: 70, height: 70 }}
              className="border shadow-sm border-2 border-light"
            />
            <p className="m-0 text-center small mt-2 fw-semibold">@{friend.username}</p>
          </div>
        ))}
        <button
          style={{ width: 50, height: 50 }}
          onClick={() => setOpen(true)}
          className="text-dark border-0 rounded-circle d-flex align-items-center justify-content-center gap-2 shadow small"
        >
          <AddOutlined size={20} />
        </button>
      </div>
      <h5 className="fw-bold text-dark m-0 mt-4 mb-3 text-secondary">Requests</h5>
      <div>
        {friendRequests.length === 0 ? (
          <p className="text-secondary small py-3">No pending friend requests.</p>
        ) : (
          friendRequests.map((request, index) => (
            <div key={index} className="d-flex shadow p-2 rounded-3 gap-3 align-items-center mb-2">
              <Avatar
                title={request.username}
                src={request.profile_pic}
                key={index}
                style={{ width: 70, height: 70 }}
                className="border shadow-sm border-2 border-light"
              />
              <div>
                <h6 className="m-0 mb-1">{request.name}</h6>
                <p className="text-secondary small m-0">{request.name} sent you a friend request!</p>

                <div className="d-flex gap-2 mt-1 small">
                  <button className="border-0 small text-white p-1 px-3 rounded" style={{
                    background:
                      "linear-gradient(135deg, #6a0dad 0%, #392b8d 65%, #1f1a4b 100%)",
                  }} onClick={() => acceptRequest(request.id)}>Accept</button>
                  <button className="border-0 small bg-danger text-white p-1 px-3 rounded">Decline</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box className="" sx={style}>
            <div className="px-2">
              <h5 className="fw-bold text-dark mb-3">Friend Request</h5>
              <div className="fw-semibold mb-4 small text-secondary">
                Send a friend request to connect and share your meal plans together!
              </div>
              <div>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                  <TextField variant="standard"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="small w-100"
                    type="search"
                    label="Search by username" />
                  <PersonSearchOutlinedIcon fontSize="large" className="border p-1 rounded bg-light" role="button" onClick={handleSearch} />
                </Box>
                {/* search friend by display name or email and send them a friend request. Once they accept, you can start sharing meal plans and recipes together! */}
                <div>
                  {statusMessage.type === 'error' && <p className="mt-3 small text-danger"><WarningAmberOutlinedIcon fontSize="small" className="me-1" /> {statusMessage.message}</p>}
                  {statusMessage.type === 'success' && <p className="mt-3 small text-success"><CheckCircleOutlinedIcon fontSize="small" className="me-1" /> {statusMessage.message}</p>}

                  {searchResult && (
                    <div className="d-flex bg-light shadow align-items-center mt-3 p-2 bg-light rounded-3">
                      <Avatar
                        title={searchResult.display_name}
                        src={searchResult.avatar_url}
                        key={searchResult.display_name}
                        style={{ width: 70, height: 70 }}
                        className="border shadow-sm border-2 bg-black"
                      />
                      <div className="mx-3">
                        <p className="fw-bold m-0 mb-2">{searchResult.display_name} <span className="small m-0 mt-1">{"(User)"}</span></p>
                        <button className="border-0 small text-white p-1 px-3 rounded" onClick={handleSendRequest} style={{
                          background:
                            "linear-gradient(135deg, #6a0dad 0%, #392b8d 65%, #1f1a4b 100%)",
                        }}>Add Friend</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button
                  className="py-2 px-3 w-auto authSignInBtn text-light small"
                  onClick={handleClose}
                  style={{
                    background:
                      "linear-gradient(135deg, #6a0dad 0%, #392b8d 65%, #1f1a4b 100%)",
                  }}
                >
                  Complete & Close
                </button>
              </div>
            </div>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
};
export default Invite;