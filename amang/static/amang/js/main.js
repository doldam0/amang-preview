$(() => {
    const token = $('meta[name="csrf-token"]').attr('content');
    const user = $('meta[name="user"]').attr('content');

    const passwordModal = $('.ui.modal#password-modal');
    const passwordInput = document.getElementById('password');
    const passwordSubmit = document.querySelector('.ui.modal#password-modal .positive.button');

    passwordInput.onkeydown = event => {
        if (event.key === 'Enter') {
            passwordSubmit.click();
        }
    };

    function checkAdmin(password) {
        return new Promise(resolve => {
            $.ajax('/advanced/login/', {
                method  : 'post',
                data    : {
                    password    : password,
                    _token      : token
                },
                success : data => {
                    resolve(data === 'admin');
                }
            });
        });
    }

    function getPassword(callback) {
        passwordModal.modal({
            onApprove   : () => {
                callback(passwordInput.value);
            }
        }).modal('show');
    }

    const advancedMenu = document.getElementById('advanced');
    advancedMenu.onclick = () => {
        if (user === 'admin') {
            location.href = '/advanced/';
        } else {
            getPassword(async password => {
                if (await checkAdmin(password)) {
                    location.href = '/advanced/';
                } else if (password !== false) {
                    modalAlert('Invalid password');
                }
            });
        }
    };

    const languageModal = document.getElementById('language-modal');
    const language = document.getElementById('language');
    if (!document.cookie.includes('sessionid')) {
        languageModal.modal({
            onApprove   : () => {
                callback(passwordInput.value);
            }
        }).modal('show');
    }
});