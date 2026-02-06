let currentPet = null;     // The Current Pet Object
let isAdminUser = false;

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

function getText(elId) {
    return (document.getElementById(elId)?.textContent || "").trim();
}

function setText(elId, value) {
    const el = document.getElementById(elId);
    if (el) el.textContent = value ?? "-";
}

function getTextFromDD(ddEl) {
    /*
    * This function returns the innertext from any given <dd> element
    */

    // Check if the element exists
    if(!ddEl){
        return ""
    }

    // Get text Content 
    let text = ddEl.textContent;

    // If no text, return empty string
    if(!text){
        return ""
    }

    // removes whte spaces if any and return
    return text.trim();
}

function buildSelect(id, items, selectedValue, placeholder) {
    /*
    * Create select drop down with a list of specified items
    * id - allows to set custom IDs
    * items - a list of items to choose in drop down
    * selectedValue - ID of the item that should be pre-selected in the dropdown
    * placeholder - a value to show when nothing is selected
    */
    let html = `<select id="${id}" class="editSelect">`;
    html += `<option value="">${placeholder}</option>`;
    items.forEach(it => {
        const sel = String(it.id) === String(selectedValue) ? "selected" : "";
        html += `<option value="${it.id}" ${sel}>${it.name}</option>`;
    });
    html += `</select>`;
    return html;
}

async function loadPetDetails() {
    const id = getQueryParam("id");
    if (!id) {
        alert("Missing pet id.");
        location.href = "gallery.html";
        return;
    }

    // Check admin
    try {
        const meRes = await fetch("/me", { credentials: "same-origin" });
        if (meRes.ok) {
            const me = await meRes.json();
            isAdminUser =
                me && me.authenticated &&
                String(me.user.type || "").toLowerCase() === "admin";
        }
    } catch (e) {
        // ignore
    }

    // Show admin bar if admin
    const bar = document.getElementById("petAdminBar");
    if (bar) bar.style.display = isAdminUser ? "flex" : "none";

    // Load pet list and find one
    const res = await fetch("/gallery", { credentials: "same-origin" });
    if (!res.ok) {
        alert("Failed to load pet.");
        location.href = "gallery.html";
        return;
    }

    const list = await res.json();
    currentPet = list.find(p => String(p.id) === String(id));
    if (!currentPet) {
        alert("Pet not found.");
        location.href = "gallery.html";
        return;
    }

    // Render your existing UI fields (adjust IDs to match your pet.html)
    // Example IDs: petName, petSpecies, petBreed, petGender, petStatus, petDesc, petHeroImg
    setText("petName", currentPet.name);
    setText("petSpecies", currentPet.speciesName || "-");
    setText("petBreed", currentPet.breedName || "-");
    setText("petGender", currentPet.gender || "-");
    setText("petDesc", currentPet.temperament || "");

    const dob = currentPet.dateOfBirth ? String(currentPet.dateOfBirth).slice(0,10) : "-";
    setText("petDob", dob === "-" ? "-" : `${dob} (${getAge(dob)})`);

    const statusEl = document.getElementById("petStatus");
    if (statusEl) {
        const statusName = currentPet.adoptionStatusName || "-";
        statusEl.textContent = statusName;
        statusEl.className = "petStatus status-" + String(statusName).toLowerCase();
    }

    const hero = document.getElementById("petHero");
    if (hero) {
        hero.innerHTML = `<img src="${currentPet.profileImg}" alt="${currentPet.name}">`;
    }
}

async function startEditDetails() {
    if (!isAdminUser || !currentPet) return;

    // Hide Edit and Delete
    document.getElementById("petEditBtn").style.display = "none";
    document.getElementById("petDeleteBtn").style.display = "none";

    // Show Save and Cancel
    document.getElementById("petEditControls").style.display = "flex";

    // Convert fields into inputs/selects

    // Getting current ELEMENTS for pet's name, species, breed, gender, dob, status, desc
    const nameEl = document.getElementById("petName");
    const speciesEl = document.getElementById("petSpecies");
    const breedEl = document.getElementById("petBreed");
    const genderEl = document.getElementById("petGender");
    const dobEl = document.getElementById("petDob");
    const statusEl = document.getElementById("petStatus");
    const descEl = document.getElementById("petDesc");

    // Getting species and statuses in the background
    const [speciesRows, statusRows] = await Promise.all([
        fetch("/api/species", { credentials: "same-origin" }).then(r => r.json()),
        fetch("/api/adoption-status", { credentials: "same-origin" }).then(r => r.json())
    ]);

    // Getting TEXT VALUES from the ELEMENTS
    const currentSpeciesName = getTextFromDD(speciesEl);
    const currentBreedName = getTextFromDD(breedEl);
    const currentStatusName = getTextFromDD(statusEl);
    const currentGender = getTextFromDD(genderEl).toLowerCase();

    // Instead of getting innter text, we go through each one in the list (of species objects) and check just to get the right species object
    const selectedSpecies = speciesRows.find(s => s.name.toLowerCase() === currentSpeciesName.toLowerCase());
    const selectedSpeciesId = selectedSpecies ? selectedSpecies.id : ""; // and extract the id attribute

    // Getting the list of associated breeds for the selected species
    let breedRows = [];
    if (selectedSpeciesId) {
        breedRows = await fetch("/api/breeds?speciesId=" + encodeURIComponent(selectedSpeciesId),
            { credentials: "same-origin" }
        ).then(r => r.json());
    }

    const selectedBreed = breedRows.find(b => b.name.toLowerCase() === currentBreedName.toLowerCase());
    const selectedBreedId = selectedBreed ? selectedBreed.id : "";
    const dobValue = currentPet.dateOfBirth ? String(currentPet.dateOfBirth).slice(0, 10) : "";
    const selectedStatus = statusRows.find(st => st.name.toLowerCase() === currentStatusName.toLowerCase());
    const selectedStatusId = selectedStatus ? selectedStatus.id : "";

    // Swap UI
    nameEl.innerHTML = `<input id="d-edit-name" class="editInput" value="${currentPet.name || ""}">`;
    speciesEl.innerHTML = buildSelect("d-edit-species", speciesRows, selectedSpeciesId, "Select Species");
    breedEl.innerHTML = buildSelect("d-edit-breed", breedRows, selectedBreedId, "Select Breed");
    statusEl.innerHTML = buildSelect("d-edit-status", statusRows, selectedStatusId, "Select Status");

    genderEl.innerHTML = `
        <select id="d-edit-gender" class="editSelect">
            <option value="">Select Gender</option>
            <option value="male" ${currentGender === "male" ? "selected" : ""}>Male</option>
            <option value="female" ${currentGender === "female" ? "selected" : ""}>Female</option>
        </select>
    `;

    dobEl.innerHTML = `
        <input type="date" id="d-edit-dob" class="editSelect" value="${dobValue}">
    `;

    // prevent future dates
    const dobInput = document.getElementById("d-edit-dob");
    dobInput.max = new Date().toISOString().split("T")[0];

    descEl.innerHTML = `<textarea id="d-edit-desc" class="editTextarea">${currentPet.temperament || ""}</textarea>`;

    const speciesSelect = document.getElementById("d-edit-species");
    const breedSelect = document.getElementById("d-edit-breed");

    speciesSelect.onchange = async function () {
        const sid = speciesSelect.value;
        breedSelect.innerHTML = `<option value="">Loading breeds…</option>`;

        if (!sid) {
            breedSelect.innerHTML = `<option value="">Select Breed</option>`;
            return;
        }

        const newBreeds = await fetch("/api/breeds?speciesId=" + encodeURIComponent(sid),
            { credentials: "same-origin" }
        ).then(r => r.json());

        let html = `<option value="">Select Breed</option>`;
        newBreeds.forEach(b => (html += `<option value="${b.id}">${b.name}</option>`));
        breedSelect.innerHTML = html;
    };
}

async function saveDetails() {
    if (!isAdminUser || !currentPet) return;

    const name = document.getElementById("d-edit-name")?.value.trim();
    const breedId = Number(document.getElementById("d-edit-breed")?.value);
    const gender = document.getElementById("d-edit-gender")?.value;
    const dateOfBirth = document.getElementById("d-edit-dob")?.value;
    const adoptionStatusId = Number(document.getElementById("d-edit-status")?.value);
    const temperament = document.getElementById("d-edit-desc")?.value.trim();

    if (!name || !dateOfBirth || !breedId || !gender || !adoptionStatusId) {
        alert("Please fill in Name, DOB, Species/Breed, Gender, and Status.");
        return;
    }

    // Check date of birth
    const today = new Date().toISOString().split("T")[0];
    if (dateOfBirth > today) {
        alert("Date of birth cannot be in the future.");
        return;
    }

    const payload = { name, dateOfBirth, breedId, gender, adoptionStatusId, temperament };

    const res = await fetch(`/gallery/${currentPet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const t = await res.text();
        alert(t || "Update failed");
        return;
    }

    // Reload the page state to show updated values
    await loadPetDetails();

    // Restore admin buttons state
    document.getElementById("petEditControls").style.display = "none";
    document.getElementById("petEditBtn").style.display = "inline-block";
    document.getElementById("petDeleteBtn").style.display = "inline-block";
}

function cancelEditDetails() {
    loadPetDetails();

    document.getElementById("petEditControls").style.display = "none";
    document.getElementById("petEditBtn").style.display = "inline-block";
    document.getElementById("petDeleteBtn").style.display = "inline-block";
}

async function deletePetFromDetails() {
    if (!isAdminUser || !currentPet) return;
    const ok = confirm("Delete this pet? This cannot be undone.");
    if (!ok) return;

    const res = await fetch(`/gallery/${currentPet.id}`, {
        method: "DELETE",
        credentials: "same-origin"
    });

    if (!res.ok) {
        const t = await res.text();
        alert(t || "Delete failed");
        return;
    }

    // Go back to gallery after delete
    location.href = "gallery.html";
}
