import React from 'react'
import {
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";
import {
  AddOutlined,
  HomeOutlined,
} from "@mui/icons-material";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { useNavigate } from "react-router-dom"; // 1. Use React Router's hook instead of Next.js


const BottomBar = ({ currentPage = 0 }) => {

  const navigate = useNavigate();
  return (
    <BottomNavigation
      className="shadow-lg bg-light"
      value={currentPage}
      showLabels
      sx={{
        position: "fixed",
        bottom: 30,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1100,
        width: "min(92%, 520px)",
        borderRadius: "18px",
        background: "#fff",
        "& .Mui-selected": {
          color: "#6A0DAD",
          fontWeight: 600,
        },
        "& .Mui-selected.MuiSvgIcon-root": {
          color: "#6A0DAD !important",
        },
      }}
    >
      <BottomNavigationAction color='inherit' onClick={() => navigate("/")} label="Home" icon={<HomeOutlined />} />
      <BottomNavigationAction color='inherit' onClick={() => navigate("/add")} label="Add New" icon={<AddOutlined />} />
      <BottomNavigationAction color='inherit' onClick={() => navigate("/account")} label="Account" icon={<PersonOutlinedIcon />} />
    </BottomNavigation>
  )
}

export default BottomBar
