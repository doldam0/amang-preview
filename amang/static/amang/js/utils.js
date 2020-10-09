function modalAlert(message) {
    console.trace();
    if (alertMessage && alertModal) {
        alertMessage.innerText = message;
        alertModal.modal('show');
    } else {
        alert(message);
    }
}

let alertModal;
let alertMessage;

$(() => {
    alertModal = $('.ui.modal#alert');
    alertMessage = document.getElementById('alert-message');
    alertModal.onkeydown = event => {
        const alertOKButton = document.querySelector('.ui.modal#alert .positive.button');

        if (event.key === 'Enter') {
            alertOKButton.click();
        }
    }
});

// Date to string function
Date.prototype.getString = function(showTime = false) {
    const year      = this.getFullYear();
    const month     = this.getMonth() + 1;
    const day       = this.getDate();

    let result = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    if (showTime) {
        const hour  = this.getHours();
        const min   = this.getMinutes();

        result = `${result}T${hour < 10 ? '0' : ''}${hour}:${min < 10 ? '0' : ''}${min}`;
    }
    return result;
}