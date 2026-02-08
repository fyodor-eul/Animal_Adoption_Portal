

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
                                <dt>Age</dt>
                                <dd data-dob="${pet.dateOfBirth || ""}">${getAge(pet.dateOfBirth)}</dd>
                            </div>

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

    const nameDD = rows[0].children[1];
    const specDD = rows[1].children[1];
    const breedDD = rows[2].children[1];
    const genderDD = rows[3].children[1];
    const ageDD = rows[4].children[1];
    const statusDD = rows[5].children[1];
    const descP = card.getElementsByClassName("petDesc")[0];

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

    // Find current breedId by name (within the species)
    const selectedBreed = breedRows.find(b => b.name.toLowerCase() === currentBreedName.toLowerCase());
    const selectedBreedId = selectedBreed ? selectedBreed.id : "";

    // Convert Age row into DOB input (edit date of birth)
    const dobValue = (ageDD.dataset.dob || "").slice(0, 10); // "YYYY-MM-DD"
    ageDD.innerHTML = `<input type="date" id="edit-dob-${id}" class="editSelect" value="${dobValue}">`;

    const dobInput = document.getElementById(`edit-dob-${id}`);
    dobInput.max = todayYMD();
    
    // Find current statusId by name
    const selectedStatus = statusRows.find(st => st.name.toLowerCase() === currentStatusName.toLowerCase());
    const selectedStatusId = selectedStatus ? selectedStatus.id : "";

    // Swap to inputs and selects
    nameDD.innerHTML = `<input id="edit-name-${id}" class="editInput" value="${nameDD.textContent.trim()}">`;

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

    // When species changes, reload breeds
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
        dateOfBirth: document.getElementById(`edit-dob-${id}`).value,
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

/* View Button */
function viewPet(id) {
    // Go to dedicated page with query param
    window.location.href = `pet_details.html?id=${encodeURIComponent(id)}`;
}
