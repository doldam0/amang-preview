$(() => {
    document.querySelector('input#date').value = new Date().getString();

    const buttons = {
        attendance  : document.querySelectorAll('button.attendance'),
        lateness    : document.querySelectorAll('button.lateness'),
        absence     : document.querySelectorAll('button.absence')
    };

    const indexes = {
        attendance  : 2,
        lateness    : 1,
        absence     : 0
    };

    for (const name in buttons) {
        buttons[name].forEach(x => x.onclick = () => {
            const pk = x.id.split('-')[1];
            for (const other in buttons) {
                if (name === other) {
                    document.querySelector(`#${other}-${pk}`).classList.remove('basic');
                } else {
                    document.querySelector(`#${other}-${pk}`).classList.add('basic');
                }
            }
            document.querySelector(`input#attendance-value-${pk}`).value = indexes[name];
        });
    }
});