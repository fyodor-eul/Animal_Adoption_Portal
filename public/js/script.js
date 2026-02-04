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


/* Gallery */
var addCardDialog = document.getElementById("addCardDialog");

function showAddCardDialog(){
    loadAddPetDropdowns();
    addCardDialog.showModal();
}

function removeAddCardDialog(){
    addCardDialog.close();
}

function fetchAnimalData() {
    // Get session user info first
    fetch("/me", { credentials: "same-origin" })
        .then(res => {
            if (!res.ok) return { authenticated: false };
            return res.json();
        })
        .then(me => {
            /* User is authenticated */
            
            // if the user is admin or not 
            const isAdmin = me && me.authenticated &&
                String(me.user.type || "").toLowerCase() === "admin";

            // Show/hide action bar
            const actionBar = document.getElementById("actionBar");
            if (actionBar) {
                // if the user is admin show action bar, if not don't show
                actionBar.style.display = isAdmin ? "flex" : "none";
            }

            // Fetch gallery data
            return fetch("/gallery", { credentials: "same-origin" })
                .then(res => {
                    if (!res.ok) return res.text().then(t => { throw new Error(t); });
                    return res.json();
                })
                .then(data => ({ data, isAdmin }));
        })
        .then(({ data, isAdmin }) => {
            const gallery = document.getElementById("galleryCarousel");
            let html = "<ul>";

            data.forEach(pet => {
                const statusClass = "status-" + String(pet.adoptionStatusName || "").toLowerCase();

                // View Button
                const viewBtnHtml = `<button class="viewPetBtn" type="button" onclick="viewPet(${pet.id})">View</button>`;

                /* Only admins see these buttons */
                // Delete Button
                const deleteBtnHtml = isAdmin
                    ? `<button class="deletePetBtn" onclick="deletePet(${pet.id})">Delete</button>`
                    : "";
                
                // Edit Button
                const editBtnHtml = isAdmin
                    ? `<button id="edit-btn-${pet.id}" class="editPetBtn" onclick="editPet(${pet.id})">Edit</button>`
                    : "";
                
                // Buttons for saving or cancelling edit process
                const saveCancelBtns = isAdmin
                    ? `
                        <div class="editControls" style="display:none;">
                            <button class="savePetBtn" onclick="savePet(${pet.id})">Save</button>
                            <button class="cancelEditBtn" onclick="cancelEdit(${pet.id})">Cancel</button>
                        </div>
                    ` : "";

                html += `
                    <li class="petCard">
                        ${editBtnHtml}
                        ${deleteBtnHtml}
                        <img src="${pet.profileImg}" alt="${pet.name}">
                        <dl class="petDetails">
                            <div class="detailRow"><dt>Name</dt><dd>${pet.name}</dd></div>

                            <div class="detailRow"><dt>Species</dt><dd>${pet.speciesName || "-"}</dd></div>
                            <div class="detailRow"><dt>Breed</dt><dd>${pet.breedName || "-"}</dd></div>
                            <div class="detailRow"><dt>Gender</dt><dd>${pet.gender || "-"}</dd></div>

                            <div class="detailRow">
                                <dt>Status</dt>
                                <dd>
                                    <span class="petStatus ${statusClass}">
                                        ${pet.adoptionStatusName || "-"}
                                    </span>
                                </dd>
                            </div>

                            <p class="petDesc">${pet.temperament || ""}</p>
                        </dl>
                        ${viewBtnHtml}
                        ${saveCancelBtns}
                    </li>
                `;
            });

            html += "</ul>";
            gallery.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Failed to load gallery");
            location.href = "/";
        });
}

function deletePet(id) {
    const ok = confirm("Delete this pet? This cannot be undone.");
    if (!ok) return;

    fetch(`/gallery/${id}`, {
        method: "DELETE",
        credentials: "same-origin"
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.text();
    })
    .then(() => {
        // Refresh list after delete
        fetchAnimalData();
    })
    .catch(err => {
        console.error(err);
        alert(err.message || "Delete failed");
    });
}

async function editPet(id) {
    const editBtn = document.getElementById(`edit-btn-${id}`);
    const card = editBtn.parentElement;

    // Hide Edit, Delete, View
    card.getElementsByClassName("editPetBtn")[0].style.display = "none";
    card.getElementsByClassName("deletePetBtn")[0].style.display = "none";
    card.getElementsByClassName("viewPetBtn")[0].style.display = "none";

    // Show Save and Cancel
    card.getElementsByClassName("editControls")[0].style.display = "flex";

    const detailsBlock = card.getElementsByClassName("petDetails")[0];
    const rows = detailsBlock.getElementsByClassName("detailRow");

    const nameDD   = rows[0].children[1];
    const specDD   = rows[1].children[1];
    const breedDD  = rows[2].children[1];
    const genderDD = rows[3].children[1];
    const statusDD = rows[4].children[1];
    const descP    = card.getElementsByClassName("petDesc")[0];

    // current display values (names)
    const currentSpeciesName = getTextFromDD(specDD);
    const currentBreedName   = getTextFromDD(breedDD);
    const currentStatusName  = getTextFromDD(statusDD);
    const currentGender      = getTextFromDD(genderDD).toLowerCase();

    // load dropdown data
    const [speciesRows, statusRows] = await Promise.all([
        fetch("/api/species", { credentials: "same-origin" }).then(r => r.json()),
        fetch("/api/adoption-status", { credentials: "same-origin" }).then(r => r.json()),
    ]);

    // find currently selected speciesId by name
    const selectedSpecies = speciesRows.find(s => s.name.toLowerCase() === currentSpeciesName.toLowerCase());
    const selectedSpeciesId = selectedSpecies ? selectedSpecies.id : "";

    // load breeds for selected species
    let breedRows = [];
    if (selectedSpeciesId) {
        breedRows = await fetch("/api/breeds?speciesId=" + encodeURIComponent(selectedSpeciesId),
            { credentials: "same-origin" }
        ).then(r => r.json());
    }

    // find current breedId by name (within the species)
    const selectedBreed = breedRows.find(b => b.name.toLowerCase() === currentBreedName.toLowerCase());
    const selectedBreedId = selectedBreed ? selectedBreed.id : "";

    // find current statusId by name
    const selectedStatus = statusRows.find(st => st.name.toLowerCase() === currentStatusName.toLowerCase());
    const selectedStatusId = selectedStatus ? selectedStatus.id : "";

    // swap to inputs/selects
    //nameDD.innerHTML = `<input id="edit-name-${id}" value="${nameDD.textContent.trim()}">`;
    nameDD.innerHTML =
    `<input id="edit-name-${id}" class="editInput" value="${nameDD.textContent.trim()}">`;

    specDD.innerHTML =
        buildSelect(`edit-species-${id}`, speciesRows, selectedSpeciesId, "Select Species")
            .replace("<select", "<select class='editSelect'");

    breedDD.innerHTML =
        buildSelect(`edit-breed-${id}`, breedRows, selectedBreedId, "Select Breed")
            .replace("<select", "<select class='editSelect'");

    statusDD.innerHTML =
        buildSelect(`edit-status-${id}`, statusRows, selectedStatusId, "Select Status")
            .replace("<select", "<select class='editSelect'");

    genderDD.innerHTML = `
        <select id="edit-gender-${id}" class="editSelect">
            <option value="">Select Gender</option>
            <option value="male" ${currentGender === "male" ? "selected" : ""}>Male</option>
            <option value="female" ${currentGender === "female" ? "selected" : ""}>Female</option>
        </select>
    `;

    descP.innerHTML = `
        <textarea id="edit-desc-${id}" class="editTextarea">${descP.textContent.trim()}</textarea>
    `;

    // dependency: when species changes, reload breeds
    const speciesSelect = document.getElementById(`edit-species-${id}`);
    const breedSelect = document.getElementById(`edit-breed-${id}`);

    speciesSelect.onchange = async function () {
        const sid = speciesSelect.value;
        breedSelect.innerHTML = `<option value="">Loading breeds...</option>`;

        if (!sid) {
            breedSelect.innerHTML = `<option value="">Select Breed</option>`;
            return;
        }

        const newBreeds = await fetch("/api/breeds?speciesId=" + encodeURIComponent(sid),
            { credentials: "same-origin" }
        ).then(r => r.json());

        // repopulate breed options
        let html = `<option value="">Select Breed</option>`;
        newBreeds.forEach(b => {
            html += `<option value="${b.id}">${b.name}</option>`;
        });
        breedSelect.innerHTML = html;
    };
}

function buildSelect(id, items, selectedValue, placeholder) {
    let html = `<select id="${id}">`;
    html += `<option value="">${placeholder}</option>`;
    items.forEach(it => {
        const sel = String(it.id) === String(selectedValue) ? "selected" : "";
        html += `<option value="${it.id}" ${sel}>${it.name}</option>`;
    });
    html += `</select>`;
    return html;
}

function getTextFromDD(dd) {
    return (dd.textContent || "").trim();
}

/* Save Button */
function savePet(id) {
    const payload = {
        name: document.getElementById(`edit-name-${id}`).value.trim(),
        breedId: Number(document.getElementById(`edit-breed-${id}`).value),
        gender: document.getElementById(`edit-gender-${id}`).value,
        adoptionStatusId: Number(document.getElementById(`edit-status-${id}`).value),
        temperament: document.getElementById(`edit-desc-${id}`).value.trim(),
    };

    if (!payload.name || !payload.breedId || !payload.gender || !payload.adoptionStatusId) {
        alert("Please fill in Name, Species/Breed, Gender, and Status.");
        return;
    }

    fetch(`/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.text();
    })
    .then(() => fetchAnimalData())
    .catch(err => {
        console.error(err);
        alert(err.message || "Update failed");
    });
}

/* Cancel Button */
function cancelEdit(id) {
    fetchAnimalData(); // simply re-render original data
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
        fetchAnimalData();                               // Refresh the gallery
        removeAddCardDialog();                           // Close the dialog
        document.getElementById("addCardForm").reset();  // Clear the form if any
    })
    .catch(error => {
        console.error("Error : ", error);
    });
}


function populateSelect(selectEl, items, placeholderText) {
    /*
    * This function fills a <select> dropdown with options based on data loaded from the database
    * selectEl - select element itself
    * items - list of items(objects) to select
    * placeholderText - default value when nothing is selected
    */
    // Make sure the dropdown option is clear before populating any values 
    while (selectEl.options.length > 0) {
        selectEl.remove(0);
    }

    // Insert placeholder text
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = placeholderText;
    selectEl.appendChild(placeholder);

    // Insert actual items
    for (let i = 0; i < items.length; i++) {
        const opt = document.createElement("option");
        opt.value = items[i].id;
        opt.textContent = items[i].name;
        selectEl.appendChild(opt);
    }
}

function loadAddPetDropdowns() {
    /*
    * This function loads lists of species(with corresponding breeds) and adoption statuses
    * when the add pet dialog is opened up
    */

    /* Select Elements */
    const speciesSelect = document.getElementById("species");
    const breedSelect = document.getElementById("breed");
    const statusSelect = document.getElementById("adoptionStatus");

    /* 
    * Load species
    * - fetch a list species as objects
    * - populate to the corresponding select element for species
    * - populate an empty list to the select element for breed
    */
    fetch("/api/species", { credentials: "same-origin" }) // credentials: "same-origin" sends cookies along with this request
        .then(res => {
            if (!res.ok) return res.text().then(t => { throw new Error(t); });
            return res.json();
        })
        .then(speciesRows => {
            populateSelect(speciesSelect, speciesRows, "Select Species");

            /* Load breeds for initial state (none selected -> show empty list) */
            populateSelect(breedSelect, [], "Select Breed");
        })
        .catch(err => {
            console.error(err);
            alert("Failed to load species dropdown");
            location.href = "/";
        });

    /* 
    * Load adoption statuses
    * - fetch a list of objects for adoption statuses
    * - populate to the corresponding select element for adoption status
    */
    fetch("/api/adoption-status", { credentials: "same-origin" }) 
        .then(res => {
            if (!res.ok) return res.text().then(t => { throw new Error(t); });
            return res.json();
        })
        .then(statusRows => {
            populateSelect(statusSelect, statusRows, "Select Status");
        })
        .catch(err => {
            console.error(err);
            alert("Failed to load adoption status dropdown");
            location.href = "/";
        });

    /* When species changes, load breeds for that species */
    speciesSelect.onchange = function() {
        const speciesId = speciesSelect.value;

        /* Make sure select for breed is empty */
        populateSelect(breedSelect, [], "Loading breeds...");

        if (!speciesId) {
            /* If the species is not selected, empty the breed showing "Select Breed" */
            populateSelect(breedSelect, [], "Select Breed");
            return; /* and stop the function */
        }

        /*
        * - fetch breeds for the selected species
        * - populate the selement elements for breeds
        */
        fetch("/api/breeds?speciesId=" + encodeURIComponent(speciesId), { credentials: "same-origin" })
            .then(res => {
                if (!res.ok) return res.text().then(t => { throw new Error(t); });
                return res.json(); // return a list of json objects(breeds for the selected species)
            })
            .then(breedRows => {
                populateSelect(breedSelect, breedRows, "Select Breed");
            })
            .catch(err => {
                console.error(err);
                alert("Failed to load breeds dropdown");
                populateSelect(breedSelect, [], "Select Breed");
                location.href = "/";
            });
    };
};

/* Manage Species Dialog (Admin) */
function showSpeciesDialog() {
    /* 
    * This function opens up the dialog
    */
    closeAllDialogs();
    document.getElementById("speciesDialog").showModal();
    loadSpeciesList();
}

function removeSpeciesDialog() {
    /*
    * This function closes the dialog
    */
    document.getElementById("speciesDialog").close();
}

function loadSpeciesList() {
    /*
    * This function fetches the list of available species and
    * populate the <div> with the ID of speciesList 
    */
    fetch("/api/species", { credentials: "same-origin" })
        .then(res => {
            if (!res.ok) return res.text().then(t => { throw new Error(t); });
            return res.json();
        })
        .then(rows => {
            const container = document.getElementById("speciesList");
            let html = "<ul>";
            rows.forEach(s => {
                html += `
                    <li>
                        <span>${s.name}</span>
                        <button type="button" onclick="deleteSpecies(${s.id})">Remove</button>
                    </li>
                `;
            });
            html += "</ul>";
            container.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Failed to load species");
        });
}

function addSpecies() {
    /*
    * This function retrieves the values from the form and creates a new species to the database
    */
    const input = document.getElementById("newSpeciesName");
    const name = input.value.trim();
    if (!name) return; // if we cannot get the name, stop

    fetch("/api/species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name })
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.json();
    })
    .then(() => {
        input.value = "";
        loadSpeciesList();

        // Refresh dropdown in Add Pet dialog if it is open
        loadAddPetDropdowns();
    })
    .catch(err => {
        console.error(err);
        alert(err.message || "Failed to add species");
    });
}

function deleteSpecies(id) {
    const ok = confirm("Delete this species? (If breeds use it, delete may fail.)");
    if (!ok) return;

    fetch("/api/species/" + id, {
        method: "DELETE",
        credentials: "same-origin"
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.text();
    })
    .then(() => {
        loadSpeciesList();
        loadAddPetDropdowns(); // refresh dropdown
    })
    .catch(err => {
        console.error(err);
        alert(err.message || "Failed to delete species");
    });
}

/* Manage Breed Dialog */
function showBreedDialog() {
    /* 
    * This function opens up the dialog
    */
    closeAllDialogs();
    document.getElementById("breedDialog").showModal();
    loadBreedList();
}

function removeBreedDialog() {
    /*
    * This function closes the dialog
    */
    document.getElementById("breedDialog").close();
}

function loadBreedList(){
    /*
    * This function
    * loads species to the select dropdown
    * fetches the list of available breed for the selected species and
    * populate the <div>
    */

    /* loads species to the select dropdown */
    const speciesSelect = document.getElementById("species-breedList");
    fetch("/api/species", { credentials: "same-origin" }) // credentials: "same-origin" sends cookies along with this request
        .then(res => {
            if (!res.ok) return res.text().then(t => { throw new Error(t); });
            return res.json();
        })
        .then(speciesRows => {
            populateSelect(speciesSelect, speciesRows, "Select Species");
            /* Refresh Breed */
            const container = document.getElementById("breedList");
            container.innerHTML = "Select species to view breeds";
        })
        .catch(err => {
            console.error(err);
            alert("Failed to load species dropdown");
            location.href = "/";
        });

    speciesSelect.onchange = function() {
        const speciesId = speciesSelect.value;

        /* Make sure select for breed is empty */
        const container = document.getElementById("breedList");
        container.innerHTML = "";

        if (!speciesId) {
            /* If the species is not selected, empty the breed showing nothing */
            container.innerHTML = "";
            return; /* and stop the function */
        }

        /* fetches the list of avaialbe breeds for the selected species */
        fetch("/api/breeds?speciesId=" + encodeURIComponent(speciesId), { credentials: "same-origin" })
            .then(res => {
                if (!res.ok) return res.text().then(t => { throw new Error(t); });
                return res.json(); // return a list of json objects(breeds for the selected species)
            })
            .then(rows => {
                if(rows.length === 0){
                    container.innerHTML = "No breed records for this species";
                }else{
                    /* populate the <div> */
                    let html = "<ul>";
                    rows.forEach(b => {
                        html += `
                            <li>
                                <span>${b.name}</span>
                                <button type="button" onclick="deleteBreed(${b.id})">Remove</button>
                            </li>
                        `;
                    });
                    html += "</ul>";
                    container.innerHTML = html;
                }
            })
            .catch(err => {
                console.error(err);
                alert("Failed to load breeds");
                container.innerHTML = "";
                location.href = "/";
            });
    }
}

function addBreed() {
    // Get elements inside the breed dialog (avoids duplicate id="species" issue)
    const breedDialog = document.getElementById("breedDialog");
    const input = document.getElementById("newBreedName");
    const speciesSelect = document.getElementById("species-breedList");

    const name = (input.value || "").trim();
    const speciesId = speciesSelect ? speciesSelect.value : "";

    if (!speciesId) {
        alert("Please select a species first.");
        return;
    }

    if (!name) {
        alert("Please enter a breed name.");
        input.focus();
        return;
    }

    fetch("/api/breeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name, speciesId: Number(speciesId) })
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.json();
    })
    .then(() => {
        // clear input
        input.value = "";

        // refresh the breed list for the currently selected species
        speciesSelect.onchange(); // invoke the onchange event function to refresh
    })
    .catch(err => {
        console.error(err);
        alert(err.message || "Failed to add breed");
    });
}

function deleteBreed(id) {
    const ok = confirm("Delete this Breed? (If breeds use it, delete may fail.)");
    if (!ok) return;

    fetch("/api/breeds/" + id, {
        method: "DELETE",
        credentials: "same-origin"
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.text();
    })
    .then(() => {
        loadBreedList();
    })
    .catch(err => {
        console.error(err);
        alert(err.message || "Failed to delete breed");
    });
}

/* Manage Adoption Status Dialog */
function showStatusDialog() {
    closeAllDialogs();
    document.getElementById("statusDialog").showModal();
    loadStatusList();
}

function removeStatusDialog() {
    document.getElementById("statusDialog").close();
}

function loadStatusList() {
    /*
    * This function fetches the list of available statues and
    * populate the <div> with the ID of statusList
    */
    fetch("/api/adoption-status", { credentials: "same-origin" })
        .then(res => {
            if (!res.ok) return res.text().then(t => { throw new Error(t); });
            return res.json();
        })
        .then(rows => {
            const container = document.getElementById("statusList");
            let html = "<ul>";
            rows.forEach(s => {
                html += `
                    <li>
                        <span>${s.name}</span>
                        <button type="button" onclick="deleteStatus(${s.id})">Remove</button>
                    </li>
                `;
            });
            html += "</ul>";
            container.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            alert(err.message || "Failed to load species");
        });
}

function addStatus() {
    const input = document.getElementById("newStatusName");
    const name = input.value.trim();
    if (!name) return;

    fetch("/api/adoption-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name })
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.json();
    })
    .then(() => {
        input.value = "";
        loadStatusList();

        // Refresh dropdown in Add Pet dialog if it is open
        loadAddPetDropdowns();
    })
    .catch(err => {
        console.error(err);
        alert(err.message || "Failed to add status");
    });
}

function deleteStatus(id) {
    const ok = confirm("Delete this status?");
    if (!ok) return;

    fetch("/api/adoption-status/" + id, {
        method: "DELETE",
        credentials: "same-origin"
    })
    .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        return res.text();
    })
    .then(() => {
        loadStatusList();
        loadAddPetDropdowns(); // refresh dropdown
    })
    .catch(err => {
        console.error(err);
        alert(err.message || "Failed to delete status");
    });
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


/* Image Preview for image file upload */
document.getElementById("profileImg").addEventListener("change", function (event) {
    const file = event.target.files[0];
    const preview = document.getElementById("previewImg");

    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    } else {
        preview.src = "";
        preview.style.display = "none";
    }
});
