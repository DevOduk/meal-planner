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
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined"

const BottomBar = ({ currentPage = -1 }) => {

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
        width: "min(92%, 560px)",
        borderRadius: "18px",
        background: "#fff",
        "& .Mui-selected": {
          color: "#6A0DAD",
          fontWeight: 600,
        },
        "&.Mui-selected.MuiSvgIcon-root": {
          color: "#6A0DAD !important",
        },
      }}
    >
      <BottomNavigationAction sx={{
        color: "#777",
        "&.Mui-selected": {
          color: "#6A0DAD",
        },
        "&.Mui-selected .MuiSvgIcon-root": {
          color: "#6A0DAD",
        },
      }} onClick={() => navigate("/")} label="Home" icon={<HomeOutlined />} />
      <BottomNavigationAction sx={{
        color: "#777",
        "&.Mui-selected": {
          color: "#6A0DAD",
        },
        "&.Mui-selected .MuiSvgIcon-root": {
          color: "#6A0DAD",
        },
      }} onClick={() => navigate("/add")} label="Add New" icon={<AddOutlined />} />
      <BottomNavigationAction sx={{
        color: "#777",
        "&.Mui-selected": {
          color: "#6A0DAD",
        },
        "&.Mui-selected .MuiSvgIcon-root": {
          color: "#6A0DAD",
        },
      }} onClick={() => navigate("/shopping")} label="Shopping" icon={<LocalMallOutlinedIcon />} />
      <BottomNavigationAction sx={{
        color: "#777",
        "&.Mui-selected": {
          color: "#6A0DAD",
        },
        "&.Mui-selected .MuiSvgIcon-root": {
          color: "#6A0DAD",
        },
      }} onClick={() => navigate("/account")} label="Account" icon={<PersonOutlinedIcon />} />
    </BottomNavigation>
  )
}

export default BottomBar
