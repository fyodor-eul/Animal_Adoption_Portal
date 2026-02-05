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

function closeAllDialogs() {
    const dialogs = document.getElementsByTagName("dialog");
    for (let i = 0; i < dialogs.length; i++) {
        if (dialogs[i].open) {
            dialogs[i].close();
        }
    }
}

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

function registerUser() {
    const usernameEl = document.getElementById("regUsername");
    const typeEl = document.getElementById("regType");
    const passEl = document.getElementById("regPassword");
    const confirmEl = document.getElementById("regConfirmPassword");

    const username = usernameEl ? usernameEl.value.trim() : "";
    const type = typeEl ? typeEl.value : ""; // string "1"/"2"
    const password = passEl ? passEl.value : "";
    const confirmPassword = confirmEl ? confirmEl.value : "";

    if (!username || !type || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        confirmEl.focus();
        return;
    }

    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
            username: username,           // backend can map this to users.name
            password: password,
            type: Number(type)            // send as number
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(msg => { throw new Error(msg); });
        }
        return res.text();
    })
    .then(msg => {
        console.log(msg);
        alert("Account created! Please login.");
        removeRegisterDialog();
        showLoginDialog();
    })
    .catch(err => {
        console.error("Register error:", err);
        alert(err.message || "Register failed.");
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

function openTab(name){
    /*
    This funciton handle what happens if we click on each tab
    including style changes and calling functions
    */

    /* Log */
    console.log(name);

    /* Remove all active highlights on tabs */
    var tabs = document.getElementsByClassName('tab');
    for(i = 0; i < tabs.length; i++){
        tabs[i].classList.remove('active');
    }
    /* Highlight the current tab */
    if(name === "home"){
        document.getElementById("homeTab").classList.add('active');
    }else if(name == "adopt"){
        document.getElementById("adoptTab").classList.add('active');
    }else if(name == "login"){
        console.log("login");
        showLoginDialog();
        //document.getElementById("aboutTab").classList.add('active');
    }else{
        console.log("error");
    }
}


/* Make the dialog close by clicking the background  */
function enableDialogBackgroundClose(dialogId) {
    const dialog = document.getElementById(dialogId);
    if(!dialog) return;   // to skip the dialogs the exist in other pages

    dialog.addEventListener("click", function (event) {
        const rect = dialog.getBoundingClientRect();     // get the position and dimensions of the dialog box

        const clickedInDialog = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        /*
        * Since (0,0) is at the top left corner,
        * The cursor position must be greater than the left edge and less than the right edge
        * greater than the top edage and less than the bottom edge
        */

        if (!clickedInDialog) {
            dialog.close();
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    enableDialogBackgroundClose("loginDialog");
    enableDialogBackgroundClose("addCardDialog");
    enableDialogBackgroundClose("speciesDialog");
    enableDialogBackgroundClose("statusDialog");
    enableDialogBackgroundClose("breedDialog");
});

function getAge(dobString) {
    if (!dobString) return "-";

    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return "-";

    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    // Adjust for negative months/days
    if (days < 0) {
        months--;
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        days += prevMonth;
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    // Construct readable output
    let result = [];

    if (years > 0) result.push(years + (years === 1 ? " year" : " years"));
    if (months > 0) result.push(months + (months === 1 ? " month" : " months"));

    // For pets younger than 1 month
    if (years === 0 && months === 0) result.push("Less than 1 month");

    return result.join(" ");
}