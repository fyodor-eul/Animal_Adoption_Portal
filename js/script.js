
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