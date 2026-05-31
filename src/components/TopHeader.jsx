import { useState, useCallback, useMemo, useEffect } from "react";
import { Avatar, Badge } from "@mui/material";
import {
  AddOutlined,
  CalendarTodayOutlined,
  HomeOutlined,
  LogoutOutlined,
} from "@mui/icons-material";

const others = [
  { name: "Alice", profile_pic: "alice.jpg" },
  { name: "Bob", profile_pic: "bob.jpg" },
  { name: "Charlie", profile_pic: "charlie.jpg" },
]; // Example number of other friends

const TopHeader = ({ profile }) => {
      const [currentDate] = useState(new Date());
          const monthName = currentDate.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (    
          <div className="mainHeader mt-3 mb-5 d-flex flex-column justify-content-between">
            <div className="d-flex mb-4 justify-content-between align-items-center gap-3">
              <div className="">
                <div className="h4 fw-bold mb-1">
                  Hello {profile?.full_name || profile?.username || "Planner"}!,
                </div>

                <div className="small">Lets plan what to eat together.</div>
              </div>
              <div className="d-flex align-items-center gap-3 text-white">
                <div
                  className="d-flex align-items-center gap-3"
                  role="button"
                  onClick={() => setCurrentPage(2)}
                >
                  <Badge
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
                    <Avatar
                      alt={profile?.username}
                      sx={{ background: "rgba(255,255,255,0.18)" }}
                      src={profile?.avatar_url}
                      className="bg-light"
                    />
                  </Badge>
                  <div className="d-flex flex-column">
                    <span className="fw-semibold">
                      You
                    </span>
                    <span className="small text-white-50">Ready to plan</span>
                  </div>
                </div>
                {/* to handle logout
                  <LogOut onClic={handleLogout} size={20} title="Logout" /> */}
              </div>
            </div>
            <div className="d-flex justify-content-end align-items-center gap-2 text-white-75">
              <CalendarTodayOutlined size={20} />
              <span className="fw-semibold">{monthName}</span>
            </div>
          </div>
  );
};
export default TopHeader;