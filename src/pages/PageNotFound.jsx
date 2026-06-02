import React from "react";
import { Link } from "react-router";
import { useAuth } from "@/context/AuthProvider";
import BottomBar from "@/components/BottomBar";
import TopHeader from "@/components/TopHeader";
import Footer from '@/components/Footer';


function PageNotFound() {
  document.title = "Page Not Found | Hey Mama Africa!";
  const { profile, setProfile, friends } = useAuth();

  return (
    <div className="container-xxl">
      <TopHeader profile={profile} />

      <div className="min-vh-100">
        <div className="text text-center border-bottom w-75 m-auto mt-3 p-5">
          <div className="display-1 fw-bold text-danger">404!</div>
          404 | That page was not found! It was either deleted or moved.
        </div>
        <div className="d-flex text-center gap-2 justify-content-center mt-5">
          <Link to="/">
            <button className="btn btn-primary-light d-flex justify-content-between align-items-center gap-3 bg-white rounded-pill px-4">
              <ion-icon name="home"></ion-icon> Back to Homepage
            </button>
          </Link>
        </div>
      </div>
      <BottomBar />
      <Footer />
    </div>
  );
}

export default PageNotFound;
