
/* Show User Details */
function showUserDetails() {
  closeAllDialogs();

  fetch("/api/users/me", {
    credentials: "same-origin"
  })
    .then(async (res) => {
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to load user details");
      }
      return res.json();
    })
    .then((user) => {
      document.getElementById("userDetailsContent").innerHTML = `
        <div class="userDetailsDialog">
            <div id="persona" class="persona">
                <div id="profileImagePreview" style="width:100px;">
                    <img src="/${user.profileImage}">
                </div>

                <div>
                    <div class="personalDetailRows"><h2 id="userFullName" data-value="${user.firstName} ${user.lastName}">${user.firstName} ${user.lastName}</h2></div>
                    <div class="personalDetailRows"><span id="userUsername">${user.username}</span></div>
                </div>
                <div class="personalDetailBtns">
                    <button id="updateParticularsBtn" class="updateParticularsBtn" onclick="updateParticulars()">Edit</button>
                    <button class="updateParticularsSaveBtn" class="updateParticularsSaveBtn" onclick="saveParticulars()">Save</button>
                    <button id="updateParticularsCancelBtn" class="updateParticularsCancelBtn" onclick="cancelUpdateParticulars()">Cancel</button>
                </div>
            </div>
            <dl id="personaDetails" class="personaDetails">
                <div class="personalDetailRows"><dt>Contact</dt><dd>${user.contactNo}</dd></div>
                <div class="personalDetailRows"><dt>Type</dt><dd>${user.userType}</dd></div>
            </dl>
            <div class="changePassword">
                <h3>Change Password</h3>
                <input type=password id="currentPassword" placeholder="current password">
                <input type=password id="newPassword" placeholder="new password">
                <input type=password id="confirmPassword" placeholder="confirm password">
            </div>
            <br>

            <button class="updatePasswordBtn" onclick="updatePassword()">Update Password</button>
            <div class="userDetailsRedBtns">
                <button class="deleteBtn" onclick="deleteUser()">Delete Account</button>
                <button class="logoutBtn" onclick="logoutUser()">Logout</button>
            </div>
        <div>
      `;
      document.getElementById("userDetailsDialog").showModal();
    })
    .catch((err) => {
      console.error("User details error:", err);
      alert(err.message);
      location.href = "/";
    });
}

function closeUserDetails() {
    document.getElementById("userDetailsDialog").close();
}

function parseFullName(fullName) {
    const name = (fullName || "").trim();
    if (!name) return { firstName: "", lastName: "" };
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(" ")
    };
}

function updateParticulars() {
    var persona = document.getElementById("persona");
    var personaDetails = document.getElementById("personaDetails");

    var personaFields = persona.getElementsByClassName("personalDetailRows");
    var personaDetailsFields = personaDetails.getElementsByClassName("personalDetailRows");

    // Add profile image upload input
    var imageRow = document.getElementById("profileImagePreview");
    imageRow.innerHTML += `
        <label for="profileImgInput" class="uploadUserProfileBtn">Edit</label>
        <input type="file" id="profileImgInput" style="display: none" accept="image/*">
    `;
    persona.insertBefore(imageRow, persona.firstChild);

    // Retrieve and STORE original values from persona section
    var fullNameEl = document.getElementById("userFullName");
    var fullNameValue = fullNameEl && fullNameEl.dataset.value ? fullNameEl.dataset.value : (fullNameEl ? fullNameEl.textContent : "");
    var usernameValue = document.getElementById("userUsername").textContent.trim();

    // Retrieve and STORE original values from personaDetails section
    var contactValue = personaDetailsFields[0].children[1].textContent.trim();
    var typeValue = personaDetailsFields[1].children[1].textContent.trim();

    // Store in persona container for later retrieval
    persona.dataset.originalFullName = fullNameValue;
    persona.dataset.originalUsername = usernameValue;
    persona.dataset.originalContact = contactValue;
    persona.dataset.originalType = typeValue;

    var nameParts = parseFullName(fullNameValue);
    var firstName = nameParts.firstName;
    var lastName = nameParts.lastName;

    // Convert persona fields to inputs
    var fullNameField = personaFields[0];
    var usernameField = personaFields[1];
    
    fullNameField.innerHTML = `
        <div>
            <input type="text" id="edit-firstName" class="editInput" value="${firstName}" placeholder="First Name">
            <input type="text" id="edit-lastName" class="editInput" value="${lastName}" placeholder="Last Name">
        </div>
    `;
    usernameField.innerHTML = `<input type="text" id="edit-username" class="editInput" value="${usernameValue}">`;

    // Convert personaDetails fields to inputs
    var contactField = personaDetailsFields[0];
    var typeField = personaDetailsFields[1];

    contactField.innerHTML = `
        <dt>Contact</dt>
        <dd><input type="text" id="edit-contact" class="editInput" value="${contactValue}"></dd>
    `;

    // Fetch user types from backend or use hardcoded values
    fetch("/api/user-types", { credentials: "same-origin" })
        .then(function(res) {
            if (!res.ok) throw new Error("Failed to load user types");
            return res.json();
        })
        .then(function(userTypes) {
            // Build type dropdown with fetched user types
            var typeOptions = '';
            for (var i = 0; i < userTypes.length; i++) {
                var selected = userTypes[i].name === typeValue ? 'selected' : '';
                typeOptions += '<option value="' + userTypes[i].id + '" ' + selected + '>' + userTypes[i].name + '</option>';
            }

            typeField.innerHTML = `
                <dt>Type</dt>
                <dd>
                    <select id="edit-type" class="editSelect">
                        ${typeOptions}
                    </select>
                </dd>
            `;
        })
        .catch(function(err) {
            console.error(err);
            // Fallback to hardcoded user types if fetch fails
            var typeOptions = '';
            typeOptions += '<option value="1" ' + (typeValue === "User" ? 'selected' : '') + '>User</option>';
            typeOptions += '<option value="2" ' + (typeValue === "Admin" ? 'selected' : '') + '>Admin</option>';

            typeField.innerHTML = `
                <dt>Type</dt>
                <dd>
                    <select id="edit-type" class="editSelect">
                        ${typeOptions}
                    </select>
                </dd>
            `;
        });

    // Show Cancel and Save buttons, hide Edit button
    document.getElementById("updateParticularsBtn").style.display = "none";
    document.getElementsByClassName("updateParticularsCancelBtn")[0].style.display = "block";
    document.getElementsByClassName("updateParticularsSaveBtn")[0].style.display = "block";
}

function cancelUpdateParticulars() {
    const persona = document.getElementById("persona");
    const personaDetails = document.getElementById("personaDetails");

    // Remove the image file input back
    const fileInput = document.getElementById("profileImgInput");
    if (fileInput) fileInput.remove();
    
    // Retrieve stored original values
    const fullNameValue = persona.dataset.originalFullName || "";
    const usernameValue = persona.dataset.originalUsername || "";
    const contactValue = persona.dataset.originalContact || "";
    const typeValue = persona.dataset.originalType || "";

    const personaFields = persona.getElementsByClassName("personalDetailRows");
    const personaDetailsFields = personaDetails.getElementsByClassName("personalDetailRows");

    // Restore persona section displays
    const fullNameField = personaFields[0];
    fullNameField.innerHTML = `<h2 id="userFullName" data-value="${fullNameValue}">${fullNameValue}</h2>`;

    const usernameField = personaFields[1];
    usernameField.innerHTML = `<span id="userUsername">${usernameValue}</span>`;

    // Restore personaDetails section displays
    const contactField = personaDetailsFields[0];
    contactField.innerHTML = `<dt>Contact</dt><dd>${contactValue}</dd>`;

    const typeField = personaDetailsFields[1];
    typeField.innerHTML = `<dt>Type</dt><dd>${typeValue}</dd>`;

    // Show Edit button, hide Cancel and Save buttons
    document.getElementById("updateParticularsBtn").style.display = "block";
    document.getElementsByClassName("updateParticularsCancelBtn")[0].style.display = "none";
    document.getElementsByClassName("updateParticularsSaveBtn")[0].style.display = "none";

    // Clean up stored data
    delete persona.dataset.originalFullName;
    delete persona.dataset.originalUsername;
    delete persona.dataset.originalContact;
    delete persona.dataset.originalType;
}

function saveParticulars() {
    const firstName = document.getElementById("edit-firstName").value.trim();
    const lastName = document.getElementById("edit-lastName").value.trim();
    const username = document.getElementById("edit-username").value.trim();
    const contactNo = document.getElementById("edit-contact").value.trim();
    const userType = document.getElementById("edit-type").value;

    if (!firstName || !lastName || !username) {
        alert("First name, last name, and username are required.");
        return;
    }

    if (!userType) {
        alert("Please select a user type.");
        return;
    }

    var formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("username", username);
    formData.append("contactNo", contactNo);
    formData.append("userType", userType);

    const imageFile = document.getElementById("profileImgInput")?.files[0];
    if (imageFile) {
        formData.append("profileImage", imageFile);
    }

    fetch("/api/users/me", {
        method: "PUT",
        credentials: "same-origin",
        body: formData
    }).then(function(res) {
        if (!res.ok) return res.text().then(function(t) { throw new Error(t); });
        return res.json();
    })
    .then(updatedUser => {
        //alert("User details updated successfully!");
        
        // Reload user details to show updated data
        //location.href = "/gallery.html";
        showUserDetails();
    })
    .catch(err => {
        console.error(err);
        alert(err.message || "Failed to update user details");
    });
}

function updatePassword() {
    var currentPw = document.getElementById("currentPassword");
    var newPw = document.getElementById("newPassword");
    var confirmPw = document.getElementById("confirmPassword");

    if (!currentPw || !newPw || !confirmPw) {
        alert("Password fields not found");
        return;
    }

    var currentPassword = currentPw.value.trim();
    var newPassword = newPw.value.trim();
    var confirmPassword = confirmPw.value.trim();

    // Validation
    if (!currentPassword) {
        alert("Please enter your current password");
        currentPw.focus();
        return;
    }

    if (!newPassword) {
        alert("Please enter a new password");
        newPw.focus();
        return;
    }

    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters long");
        newPw.focus();
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match");
        confirmPw.focus();
        return;
    }

    if (currentPassword === newPassword) {
        alert("New password must be different from current password");
        newPw.focus();
        return;
    }

    // Send request to backend
    var payload = {
        currentPassword: currentPassword,
        newPassword: newPassword
    };

    fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
    })
    .then(function(res) {
        if (!res.ok) return res.text().then(function(t) { throw new Error(t); });
        return res.text();
    })
    .then(function() {
        alert("Password updated successfully!");
        
        // Clear password fields
        currentPw.value = "";
        newPw.value = "";
        confirmPw.value = "";
    })
    .catch(function(err) {
        console.error(err);
        alert(err.message || "Failed to update password");
    });
}

function deleteUser() {
    const ok = confirm(
        "Are you sure you want to delete your account?\n\nThis cannot be undone."
    );
    if (!ok) return;

    fetch("/api/users/me", {
        method: "DELETE",
        credentials: "same-origin"
    })
        .then(async (res) => {
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to delete account");
            }
            return res.text();
        })
        .then(() => {
            alert("Account deleted.");
            // Redirect to landing / login page (adjust if needed)
            location.href = "/";
        })
        .catch((err) => {
            console.error("Delete user error:", err);
            alert(err.message);
        });
}
