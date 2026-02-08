

function showLoginDialog() {
    closeAllDialogs();
    document.getElementById('loginDialog').showModal();
}

function removeLoginDialog() {
    document.getElementById('loginDialog').close();
}

function showRegisterDialog() {
    closeAllDialogs();
    document.getElementById('registerDialog').showModal();
}

function removeRegisterDialog() {
    document.getElementById('registerDialog').close();
}

function loginUser() {
    const usernameEl = document.getElementById("loginUsername");
    const passwordEl = document.getElementById("loginPassword");

    const username = usernameEl ? usernameEl.value.trim() : "";
    const password = passwordEl ? passwordEl.value : "";

    if (!username || !password) {
        alert("Username and password are required.");
        return;
    }

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin", // ensures session cookie is stored/sent
        body: JSON.stringify({ username: username, password: password })
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(msg => { throw new Error(msg); });
        }
        return res.text();
    })
    .then(msg => {
        console.log(msg); // "Successful Login" from server.js
        removeLoginDialog();

        // After login, the user can access /gallery without 401
        window.location.href = "gallery.html";
    })
    .catch(err => {
        console.error("Login error:", err);
        alert(err.message || "Login failed. Please try again.");
        location.href = "/";
    });
}

/* Image Preview on Registration Form */
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("regProfileImage");
    const preview = document.getElementById("regPreviewImg");
    if (!input || !preview) return;

    input.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
        } else {
            preview.src = "";
            preview.style.display = "none";
        }
    });
});

function registerUser() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    const password = document.getElementById("regPassword")?.value || "";
    const confirmPassword = document.getElementById("regConfirmPassword")?.value || "";
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        document.getElementById("regConfirmPassword")?.focus();
        return;
    }

    // Build multipart form (includes file input automatically)
    const formData = new FormData(form);

    fetch("/register", {
        method: "POST",
        credentials: "same-origin",
        body: formData
    })
    .then(async (res) => {
        const txt = await res.text();
        if (!res.ok) throw new Error(txt || "Registration failed");
        return txt;
    })
    .then(() => {
        alert("Account created! Please login.");
        removeRegisterDialog();
        showLoginDialog();
    })
    .catch((err) => {
        console.error(err);
        alert(err.message);
    });
}

function checkPasswords() {
    const passEl = document.getElementById("regPassword");
    const confirmEl = document.getElementById("regConfirmPassword");

    if (passEl.value && confirmEl.value && passEl.value !== confirmEl.value) {
        confirmEl.style.borderColor = "red";
    } else {
        confirmEl.style.borderColor = "";
    }
}

function logoutUser() {
    fetch("/logout", {
        method: "POST",
        credentials: "same-origin"
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.text();
    })
    .then(msg => {
        console.log(msg);
        window.location.href = "/";  // redirect to the home page
    })
    .catch(err => {
        console.error("Logout error:", err);
        alert("Failed to logout.");
    });
}

/* Navigation Bar */
function renderNavBar() {
    const nav = document.getElementById("navBar");
    if (!nav) return;

    fetch("/me", {
        method: "GET",
        credentials: "same-origin"
    }).then((res) => {
        nav.innerHTML = `<div id="homeTab" class="tab" onclick="goHome()">Home</div>`;
        if (res.status === 401) {
            // Logged out
            nav.innerHTML += `<div id="loginTab" class="tab" onclick="showLoginDialog()">Login</div>`;
            setActiveTab();
            return;
        }else{
            // Logged in
            nav.innerHTML += `
                <div id="galleryTab" class="tab" onclick="goGallery()">Gallery</div>
                <div id="userTab" class="tab" onclick="showUserDetails()">User</div>
            `;
            setActiveTab();
        }
    }).catch((err) => {
            console.error("Navbar render failed:", err);
            nav.innerHTML = `
                <div id="homeTab" class="tab" onclick="goHome()">Home</div>
                <div id="loginTab" class="tab" onclick="showLoginDialog()">Login</div>
            `;
            setActiveTab();
        });
}

function setActiveTab() {
    const path = (window.location.pathname || "").toLowerCase();

    if (path.includes("gallery")) {
        document.getElementById("galleryTab")?.classList.add("active");
        return;
    }

    if (path.includes("user")) {
        document.getElementById("userTab")?.classList.add("active");
        return;
    }

    document.getElementById("homeTab")?.classList.add("active");
}

function goHome() {
    window.location.href = "/";
}

function goGallery() {
    window.location.href = "/gallery.html";
}
