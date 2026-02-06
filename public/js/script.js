

function closeAllDialogs() {
    const dialogs = document.getElementsByTagName("dialog");
    for (let i = 0; i < dialogs.length; i++) {
        if (dialogs[i].open) {
            dialogs[i].close();
        }
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
    enableDialogBackgroundClose("userDetailsDialog");
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

function todayYMD() {
    /* This function returns today's date */
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}




