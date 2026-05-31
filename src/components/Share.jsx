  import { Badge } from "@mui/material";
  
  
  const Share = () => {
    return (
      <div className="card shadow-sm border-0 p-4 mb-4">
        <h5 className="fw-bold text-dark m-0 mb-3">Share with Friends</h5>
        <span className="fw-semibold mb-3 small text-secondary">
          Share the joy of meal planning with your loved ones!
        </span>
        <div className="d-flex flex-wrap gap-3 align-items-center">
          {[
            "facebook",
            "twitter",
            "instagram",
            "whatsapp",
            "telegram",
            "link", // Copy link button
            "more", // Native share menu button
          ].map((social, index) => {
            // Determine the correct Font Awesome icon class based on the type
            const isCustomAction = social === "link" || social === "more";
            const iconClass = isCustomAction
              ? social === "link"
                ? "fas fa-link"
                : "fas fa-ellipsis-h"
              : `fab fa-${social}`;

            return (
              <button
                key={index}
                style={{ width: 40, height: 40 }}
                onClick={() => {
                  const shareUrl = "https://meal-planner-nine-mu.vercel.app/";
                  const shareText =
                    "I've been using this awesome meal planner app to organize my meals. Check it out!";

                  // 1. Facebook handling
                  if (social === "facebook") {
                    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                    window.open(facebookShareUrl, "_blank");
                    return;
                  }

                  // 2. Twitter handling
                  if (social === "twitter") {
                    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                    window.open(twitterShareUrl, "_blank");
                    return;
                  }

                  // 3. Copy Link Action
                  if (social === "link") {
                    navigator.clipboard
                      .writeText(shareUrl)
                      .then(() => alert("Link copied to clipboard!"))
                      .catch((err) =>
                        console.error("Could not copy link: ", err),
                      );
                    return;
                  }

                  // 4. "More" Button Action (Triggers native mobile share sheet)
                  if (social === "more") {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: "Check out my meal plan!",
                          text: shareText,
                          url: shareUrl,
                        })
                        .catch((err) => console.log("Error sharing:", err));
                    } else {
                      alert(
                        "Web Share not supported on this browser. Copy the link instead!",
                      );
                    }
                    return;
                  }

                  // 5. Default Fallbacks for remaining social networks
                  let defaultUrl = "";
                  if (social === "whatsapp") {
                    defaultUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
                  } else if (social === "telegram") {
                    defaultUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                  } else if (social === "instagram") {
                    // Instagram doesn't support direct URL sharing intents, redirecting to web platform
                    defaultUrl = `https://www.instagram.com/`;
                  }

                  if (defaultUrl) {
                    window.open(defaultUrl, "_blank");
                  }
                }}
                className="text-dark border-0 rounded-circle d-flex align-items-center justify-content-center gap-2 shadow small"
                title={social.charAt(0).toUpperCase() + social.slice(1)}
              >
                <i className={`${iconClass} fs-5`}></i>
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  export default Share;