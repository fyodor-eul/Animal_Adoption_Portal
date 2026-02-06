/* Dialog for adding cards or pets */
var addCardDialog = document.getElementById("addCardDialog");

function showAddCardDialog(){
    loadAddPetDropdowns();
    addCardDialog.showModal();

    const addDob = document.getElementById("dob");
    if (addDob) addDob.max = todayYMD();
}

function removeAddCardDialog(){
    addCardDialog.close();
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

/* Manage Species Dialog */
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
