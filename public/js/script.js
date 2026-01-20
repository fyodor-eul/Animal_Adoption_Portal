
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
    }else if(name == "about"){
        document.getElementById("aboutTab").classList.add('active');
    }else{
        console.log("error");
    }
}


/* Gallery */


/* Add to Gallery Pop-up Box */
var dialog = document.getElementById("addCardDialog");

function showAddCardForm(){
    dialog.showModal();
}

/* Retrieve the data */
function fetchAnimalData(){
    console.log("fetchAnimalData")
    var animalArray = [];
    fetch('/gallery', {
        method: 'GET'
    })
    .then(response => {
        if(!response.ok){
            throw new Error('Error: The response was not ok, please check logs');
        }
        return response.json();
    })
    .then(data => {
        animalArray = data;
        console.log(animalArray);
        insertDynamicCards(animalArray);
    })
    .catch(error => {
        console.log('Error: ', error);
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

/* Create a New Card */
/*
function addAnimalData(){
    var formElement = document.getElementById('addCardForm');
    var formData = new FormData(formElement);
    var animalData = Object.fromEntries(formData.entries());
    var jsonString = JSON.stringify(animalData);

    fetch('/gallery', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonString,
    })
    .then(response => {
        if(!response.ok){
            throw new Error('Error: The response was not ok');
        }
        response.text()
    })
    .then(data => {
        location.href = "gallery.html";
    })
    .catch(error => {
        console.error("Error : ", error);
    });
}
*/

function addAnimalData(){
    console.log("addAnimalData running");
    var formElement = document.getElementById('addCardForm');
    var formData = new FormData(formElement);

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
        location.href = "gallery.html";
    })
    .catch(error => {
        console.error("Error : ", error);
    });
}
