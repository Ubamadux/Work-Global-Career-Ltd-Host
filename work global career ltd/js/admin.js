
/* ==========================================
   WORK GLOBAL ADMIN DASHBOARD
========================================== */

// Replace these two values with your own
// Supabase Project URL and publishable key.
const SUPABASE_URL = "https://qpqfyqgzvnaxpdpzldmz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dYRUeB3IAupZgiAVzNbF-w_ZOJX0mTM";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// HTML elements
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("admin-login-form");
const loginMessage = document.getElementById("login-message");
const dashboardMessage = document.getElementById("dashboard-message");
const reviewsList = document.getElementById("reviews-list");
const logoutButton = document.getElementById("logout-btn");
const refreshButton = document.getElementById("refresh-btn");

let currentStatus = "pending";

// ------------------------------------------
// DISPLAY MESSAGES
// ------------------------------------------

function showLoginMessage(message, isError = true) {
    loginMessage.textContent = message;
    loginMessage.style.color = isError ? "#d71920" : "#187a3d";
}

function showDashboardMessage(message, isError = false) {
    dashboardMessage.textContent = message;
    dashboardMessage.style.color = isError ? "#d71920" : "#187a3d";
}

// ------------------------------------------
// CHECK ADMIN ACCESS
// ------------------------------------------

async function verifyAdmin() {
    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        showLogin();
        return false;
    }

    const { data: isAdmin, error } = await supabaseClient
        .rpc("is_current_user_admin");

    if (error || isAdmin !== true) {
        await supabaseClient.auth.signOut();
        showLogin();
        showLoginMessage(
            "This account does not have administrator access."
        );
        return false;
    }

    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    logoutButton.classList.remove("hidden");

    await loadReviews();

    return true;
}

// ------------------------------------------
// SHOW LOGIN
// ------------------------------------------

function showLogin() {
    loginSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    logoutButton.classList.add("hidden");
}

// ------------------------------------------
// ADMIN LOGIN
// ------------------------------------------

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value;

    const submitButton = loginForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    submitButton.textContent = "Signing In...";
    loginMessage.textContent = "";

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        await verifyAdmin();

    } catch (error) {
        console.error("Admin login error:", error);
        showLoginMessage(
            "Sign-in failed. Check your email and password, then try again."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Sign In";
    }
});

// ------------------------------------------
// LOAD REVIEWS
// ------------------------------------------

async function loadReviews() {
    reviewsList.innerHTML = "<p>Loading reviews...</p>";
    showDashboardMessage("");

    const { data, error } = await supabaseClient
        .from("student_reviews")
        .select("*")
        .eq("status", currentStatus)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Review loading error:", error);
        reviewsList.textContent = "Unable to load reviews.";
        showDashboardMessage(
            "Could not load reviews. Please try again.",
            true
        );
        return;
    }

    reviewsList.innerHTML = "";

    if (!data || data.length === 0) {
        reviewsList.innerHTML =
            "<p>No " + currentStatus + " reviews found.</p>";
        return;
    }

    data.forEach(function (review) {
        const card = document.createElement("article");
        card.className = "review-card";

        const name = document.createElement("h3");
        name.textContent = review.student_name;

        const meta = document.createElement("p");
        meta.className = "review-meta";
        meta.textContent =
            "Programme: " + review.programme + " | Submitted: " +
            new Date(review.created_at).toLocaleString();

        const status = document.createElement("span");
        status.className = "review-status";
        status.textContent = review.status;

        const rating = document.createElement("div");
        rating.className = "review-rating";
        rating.textContent =
            "★".repeat(review.rating) +
            "☆".repeat(5 - review.rating);

        const reviewText = document.createElement("p");
        reviewText.className = "review-text";
        reviewText.textContent = review.review_text;

        card.appendChild(name);
        card.appendChild(meta);
        card.appendChild(status);
        card.appendChild(rating);
        card.appendChild(reviewText);

        if (review.success_story) {
            const story = document.createElement("p");
            story.className = "review-text";
            story.textContent =
                "Success story: " + review.success_story;
            card.appendChild(story);
        }

        if (currentStatus === "pending") {
            const actions = document.createElement("div");
            actions.className = "review-actions";

            const approveButton = document.createElement("button");
            approveButton.className = "btn btn-approve";
            approveButton.textContent = "Approve";

            approveButton.addEventListener("click", function () {
                moderateReview(review.id, "approved", approveButton);
            });

            const rejectButton = document.createElement("button");
            rejectButton.className = "btn btn-reject";
            rejectButton.textContent = "Reject";

            rejectButton.addEventListener("click", function () {
                moderateReview(review.id, "rejected", rejectButton);
            });

            actions.appendChild(approveButton);
            actions.appendChild(rejectButton);
            card.appendChild(actions);
        }

        reviewsList.appendChild(card);
    });
}

// ------------------------------------------
// APPROVE OR REJECT A REVIEW
// ------------------------------------------

async function moderateReview(reviewId, newStatus, button) {
    const action = newStatus === "approved" ? "approve" : "reject";

    if (!confirm("Are you sure you want to " + action + " this review?")) {
        return;
    }

    button.disabled = true;
    button.textContent = "Processing...";

    const updateData = {
        status: newStatus,
        approved_at: newStatus === "approved"
            ? new Date().toISOString()
            : null
    };

    const { error } = await supabaseClient
        .from("student_reviews")
        .update(updateData)
        .eq("id", reviewId);

    if (error) {
        console.error("Review moderation error:", error);
        showDashboardMessage(
            "The review could not be updated. Please try again.",
            true
        );
        button.disabled = false;
        button.textContent =
            newStatus === "approved" ? "Approve" : "Reject";
        return;
    }

    showDashboardMessage(
        "Review successfully " + newStatus + "."
    );

    await loadReviews();
}

// ------------------------------------------
// DASHBOARD TABS
// ------------------------------------------

document.querySelectorAll(".tab-btn").forEach(function (tab) {
    tab.addEventListener("click", async function () {
        document.querySelectorAll(".tab-btn").forEach(function (item) {
            item.classList.remove("active");
        });

        tab.classList.add("active");
        currentStatus = tab.dataset.status;

        await loadReviews();
    });
});

// ------------------------------------------
// REFRESH REVIEWS
// ------------------------------------------

refreshButton.addEventListener("click", loadReviews);

// ------------------------------------------
// SIGN OUT
// ------------------------------------------

logoutButton.addEventListener("click", async function () {
    await supabaseClient.auth.signOut();
    showLogin();
    loginForm.reset();
    showLoginMessage("You have signed out.", false);
});

// ------------------------------------------
// CHECK EXISTING SESSION
// ------------------------------------------

verifyAdmin();