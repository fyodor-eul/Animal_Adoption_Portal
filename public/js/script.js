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


/* Gallery */


/* Add to Gallery Pop-up Box */
var addCardDialog = document.getElementById("addCardDialog");

function showAddCardDialog(){
    addCardDialog.showModal();
}

function removeAddCardDialog(){
    addCardDialog.close();
}

function fetchAnimalData() {
    fetch("/gallery")
        .then(res => {
            if (!res.ok) return res.text().then(t => { throw new Error(t); });
            return res.json();
        })
        .then(data => {
            const gallery = document.getElementById("galleryCarousel");

            let html = "<ul>";

            data.forEach(pet => {
                console.log(pet);
                // Status badge class
                const statusClass = "status-" + String(pet.adoptionStatusName || "").toLowerCase();

                html += `
                    <li class="petCard">
                        <img src="${pet.profileImg}" alt="${pet.name}">
                        <dl class="petDetails">
                            <dt>Name</dt><dd>${pet.name}</dd>

                            <dt>Species</dt><dd>${pet.speciesName || "-"}</dd>
                            <dt>Breed</dt><dd>${pet.breedName || "-"}</dd>
                            <dt>Gender</dt><dd>${pet.gender || "-"}</dd>

                            <dt>Status</dt>
                            <dd>
                                <span class="petStatus ${statusClass}">
                                    ${pet.adoptionStatusName || "-"}
                                </span>
                            </dd>

                            <p class="petDesc">${pet.temperament || ""}</p>
                        </dl>
                    </li>
                `;
            });

            html += "</ul>";
            gallery.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Failed to load gallery");
        });
}

function getAge(dobString) {
    const dob = new Date(dobString);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();

    // If birthday hasn't happened yet this year → subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }

    return age;
}

/* Insert into the page */
function insertDynamicCards(arrayOfAnimals){
    console.log("insertDynamicCards")
    var dynamicAnimalList = document.getElementById('galleryCarousel');

    var newContent = "";
    newContent += "<ul>";
    //var newContent = "<li class='petCard'>";
    for(var i = 0; i < arrayOfAnimals.length; i++){
        console.log(arrayOfAnimals[i]);
        newContent += "<li class='petCard'>";
        newContent += "<img src='" + arrayOfAnimals[i].profileImg + "' width='150'>";
        newContent += "<dl class='petDetails'>";

        newContent += "<dt>Name</dt>";
        newContent += "<dd>" + arrayOfAnimals[i].name + "</dd>";

        newContent += "<dt>Age</dt>";
        newContent += "<dd>" + getAge(arrayOfAnimals[i].dateOfBirth) + " Years </dd>";

        newContent += "</dl>";
        newContent += "</li>";
    }
    newContent += "</ul>";

    dynamicAnimalList.innerHTML = newContent;
}

function addAnimalData(){
    var formElement = document.getElementById('addCardForm');
    var formData = new FormData(formElement);
    console.log(formData);

    fetch('/gallery', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if(!response.ok){
            throw new Error('Error: The response was not ok');
        }
        return response.json();
    })
    .then(data => {
        //location.href = "gallery.html";
        console.log("Added Successfully");
    })
    .catch(error => {
        console.error("Error : ", error);
    });
}
