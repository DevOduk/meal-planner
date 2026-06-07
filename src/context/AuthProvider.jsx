import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Alert, Snackbar } from "@mui/material";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState([false, "", ""]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const [toast, setToast] = useState({ open: false, message: "", severity: "" });

  const handleCloseToast = (event, reason) => {
    if (reason === "clickaway") return;
    setToast({ ...toast, open: false });
  };

  // Fetch base profile data out of planner_profiles table
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("planner_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error loading user profile:", err.message);
    }
  };

  // Fetch pending incoming friend requests
  const getFriendRequests = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("planner_friendships")
        .select(`
          id,
          created_at,
          status,
          sender_id,
          sender:planner_profiles!planner_friendships_sender_id_fkey (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq("receiver_id", userId)
        .eq("status", "pending");

      if (error) throw error;

      const formattedRequests = data.map((req) => ({
        id: req.id,
        createdAt: req.created_at,
        senderId: req.sender_id,
        name: req.sender?.full_name || "Unknown User",
        username: req.sender?.username || "Anonymous",
        avatar: req.sender?.avatar_url || ""
      }));

      // 2. Set to independent state
      setFriendRequests(formattedRequests);
    } catch (err) {
      console.error("Error fetching friend requests:", err.message);
      setFriendRequests([]);
    }
  };

  // Fetch accepted friends
  const getFriends = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("planner_friendships")
        .select(`
          id,
          sender_id,
          receiver_id,
          sender:planner_profiles!planner_friendships_sender_id_fkey (id, full_name, username, avatar_url, meals),
          receiver:planner_profiles!planner_friendships_receiver_id_fkey (id, full_name, username, avatar_url, meals)
        `)
        .eq("status", "accepted")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) throw error;

      const formattedFriends = data.map((friendship) => {
        const isSender = friendship.sender_id === userId;
        const friendProfile = isSender ? friendship.receiver : friendship.sender;

        return {
          friendshipId: friendship.id,
          id: friendProfile.id,
          username: friendProfile.username || "Anonymous",
          name: friendProfile.full_name || "Anonymous Friend",
          avatar: friendProfile.avatar_url || "",
          meals: friendProfile.meals || {}
        };
      });

      // 3. Set to independent state
      setFriends(formattedFriends);
    } catch (err) {
      console.error("Error fetching friends:", err.message);
      setFriends([]);
    }
  };

  // Shared orchestrator function to update all user context cleanly
  const loadAllUserData = async (userId) => {
    setLoading(true);
    await Promise.all([
      fetchProfile(userId),
      getFriendRequests(userId),
      getFriends(userId)
    ]);
    setLoading(false);
  };

  // Listen for auth state changes globally
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const initialUser = session?.user ?? null;
      setUser(initialUser);
      if (initialUser) {
        loadAllUserData(initialUser.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        loadAllUserData(currentUser.id);
      } else {
        setProfile(null);
        setFriendRequests([]);
        setFriends([]);
        setLoading(false);
        if (event === "SIGNED_OUT") {
          navigate("/login");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setToast({ open: true, message: error.message, severity: "error" });
      setLoading(false);
      return false;
    }

    setToast({ open: true, message: "Login successful!", severity: "success" });
    setTimeout(() => {
      navigate("/");
    }, 1500); // Trimmed delay down from 4000ms for a snappier user experience
    return true;
  };

  const handleSignUp = async (email, password, userName, fullName) => {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, username: userName } },
    });

    if (error) {
      setToast({ open: true, message: error.message, severity: "error" });
      setLoading(false);
      return false;
    }

    setToast({ open: true, message: "Account created! Check email if confirmation is required.", severity: "success" });
    setLoading(false);
    navigate("/onboarding");
    return true;
  };

  const handleUpdate = async (email, password, userName, fullName, phone, profilePicture) => {
    setLoading(true);

    console.log("Initiating account update with:", { email, password, userName, fullName, phone, profilePicture });

    const cleanUsername = userName.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Get the current logged-in user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No active user session found.");

      // 2. Step One: Check if the new username is already taken by SOMEONE ELSE
      const { data: usernameCheck, error: checkError } = await supabase
        .from("planner_profiles")
        .select("id")
        .eq("username", cleanUsername)
        .neq("id", user.id) // Exclude the current user so they can save their own username
        .maybeSingle();

      if (checkError) throw checkError;
      if (usernameCheck) {
        setToast({ open: true, message: "Username is already taken!", severity: "error" });
        setError([true, "username_taken", `Username "${cleanUsername}" is already taken!`]);
        setLoading(false);
        return false;
      }

      // 3. Step Two: Update your public.planner_profiles table records
      const { error: profileError } = await supabase
        .from("planner_profiles")
        .update({
          username: cleanUsername,
          full_name: fullName.trim(), // Matches your newly renamed column!
          phone: phone.trim(), // Add the phone number update
          avatar_url: profilePicture.trim(), // Add the phone number update
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 4. Step Three: Prepare the Supabase Auth update payload
      const authUpdates = {};

      // Only update email if it actually changed
      if (cleanEmail !== user.email) {
        authUpdates.email = cleanEmail;
      }

      // Only update password if the user typed something into the password input box
      if (password && password.trim() !== "") {
        if (password.length < 6) {
          setError([true, "passwordlength", "Password must be at least 6 characters."]);
          setLoading(false);
          return false;
        }
        authUpdates.password = password;
      }

      // 5. Step Four: Execute the Auth update if modifications exist
      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);

        if (authError) throw authError;

        // If email was changed, let them know verification links were sent
        if (authUpdates.email) {
          setToast({
            open: true,
            message: "Profile updated! Confirm your change via the links sent to both your old and new email addresses.",
            severity: "info"
          });
          setProfile((prev) => ({ ...prev, username: cleanUsername, full_name: fullName.trim(), phone: phone.trim(), avatar_url: profilePicture.trim() }));
          setLoading(false);
          return true;
        }
      }

      setToast({ open: true, message: "Changes saved successfully!", severity: "success" });
      setLoading(false);
      setProfile((prev) => ({ ...prev, username: cleanUsername, full_name: fullName.trim(), phone: phone.trim(), avatar_url: profilePicture.trim() }));
      return true;

    } catch (error) {
      console.error("Account update operation failed:", error);
      setToast({ open: true, message: error.message || "Failed to update profile.", severity: "error" });
      setLoading(false);
      setError([true, "update_failed", error.message || "Failed to update profile."]);
      return false;
    }
  };

  const handleResetPassword = async (email) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });

    if (error) {
      setToast({ open: true, message: error.message, severity: "error" });
      setLoading(false);
      return false;
    }

    setToast({ open: true, message: "Password reset link sent!", severity: "success" });
    setLoading(false);
    return true;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleUpdatePassword = async (newPassword) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setToast({ open: true, message: error.message, severity: "error" });
      setLoading(false);
      return false;
    }

    setToast({ open: true, message: "Password updated successfully!", severity: "success" });
    setLoading(false);

    navigate("/login");
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        setProfile,
        friends,           // 4. Expose social states to context consumers
        friendRequests,    // 4. Expose social states to context consumers
        getFriends,        // Helper to manually refetch after accepting requests
        getFriendRequests, // Helper to manually refetch after accepting requests
        loading,
        setLoading,
        error,
        setError,
        setToast,
        handleLogin,
        handleSignUp,
        handleResetPassword,
        handleUpdatePassword,
        handleUpdate,
        handleSignOut,
      }}
    >
      {children}

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px", fontWeight: 500 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};