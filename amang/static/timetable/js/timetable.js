window.onload = async () => {
    console.log('start');

    const calendar = new tui.Calendar('#calendar', {
        defaultView     : 'week',
        taskView        : false,
        scheduleView    : ['time'],
        week            : {
            hourStart   : 8,
            hourEnd     : 22
        }
    });

    function convertToSchedule(data) {
        function getRandomColor() {
            const randomColor = [
                '#FFB5E8',
                '#FF9CEE',
                '#FFCCF9',
                '#FCC2FF',
                '#F6A6FF',
                '#B28DFF',
                '#C5A3FF',
                '#D5AAFF',
                '#ECD4FF',
                '#FBE4FF',
                '#DCD3FF',
                '#A79AFF',
                '#B5B9FF',
                '#97A2FF',
                '#AFCBFF',
                '#AFF8DB',
                '#C4FAF8',
                '#85E3FF',
                '#ACE7FF',
                '#6EB5FF',
                '#BFFCC6',
                '#DBFFD6',
                '#F3FFE3',
                '#E7FFAC',
                '#FFFFD1',
                '#FFC9DE',
                '#FFABAB',
                '#FFBEBC',
                '#FFCBC1',
                '#FFF5BA'
            ]
            const random = Math.floor(Math.random() * 30);
            return randomColor[random];
        }

        data.calendarId     = calendar.id;
        data.body           = data['director_name'];
        data.category       = 'time';
        data.dueDateClass   = '';
        data.bgColor        = getRandomColor();
        data.start          = new Date(data.start);
        data.end            = new Date(data.end);
        return data;
    }

    function getSchedules(start = '', end = '') {
        function resolveData(data, resolve) {
            for (let i = 0; i < data.length; i++) {
                data[i] = convertToSchedule(data[i])
            }
            resolve(data);
        }

        if (start && end) {
            return new Promise(resolve => {
                $.ajax(`/timetable/get?start=${start}&end=${end}`, {
                    success : data => resolveData(data, resolve)
                });
            });
        } else {
            return new Promise(resolve => {
                $.ajax('/timetable/get', {
                    success : data => resolveData(data, resolve)
                });
            });
        }
    }

    function getStartTime() {
        return calendar.getDateRangeStart().toUTCString();
    }

    function getEndTime() {
        return calendar.getDateRangeEnd().toUTCString();
    }

    async function setCalendar(render = false) {
        calendar.clear();

        const schedules = await getSchedules(getStartTime(), getEndTime());
        calendar.createSchedules(schedules, !render);
    }
    await setCalendar();

    function setDateRange() {
        const renderRange = document.getElementById('render-range');
        const start = calendar.getDateRangeStart().toDate().getString();
        const end = calendar.getDateRangeEnd().toDate().getString();
        if (calendar.getViewName() === 'day') {
            renderRange.innerText = start;
        } else {
            renderRange.innerText = start + ' ~ ' + end;
        }
    }

    document.getElementById('today-button').onclick = async () => {
        calendar.today();
        calendar.scrollToNow();
        await setCalendar(true);
        setDateRange();
    }

    document.getElementById('prev-button').onclick = async () => {
        calendar.prev();
        await setCalendar(true);
        setDateRange();
    }

    document.getElementById('next-button').onclick = async () => {
        calendar.next();
        await setCalendar(true);
        setDateRange();
    }

    function resize() {
        if (window.innerWidth < 768) {
            if (calendar.getViewName() === 'week') {
                calendar.changeView('day', false);
                setDateRange();
            }
        } else {
            if (calendar.getViewName() === 'day') {
                calendar.changeView('week', false);
                setDateRange();
            }
        }

        calendar.render();
    }
    setDateRange();
    resize();

    window.onresize = () => {
        resize();
    }

    function preprocess(data) {
        let result = {};
        for (let elem of data) {
            result[elem.name] = elem.value;
        }
        return result;
    }

    async function postSchedule(data, method = 'add') {
        const post = () => new Promise(resolve => {
            $.ajax(`/timetable/${method}/`, {
                type    : 'post',
                data    : data,
                success : result => resolve(result)
            });
        });

        const result = await post();
        return convertToSchedule(result);
    }

    async function deleteSchedule(scheduleId) {
        return new Promise(resolve => {
            $.ajax(`/timetable/delete/${scheduleId}`, {
                success : result => resolve(result)
            });
        });
    }

    // Select Time
    let startTime = null, endTime = null;
    calendar.on('beforeCreateSchedule', event => {
        startTime = event.start.toDate().getString(true);
        endTime = event.end.toDate().getString(true);
    });

    // Move Schedule
    calendar.on('beforeUpdateSchedule', async event => {
        const schedule = event.schedule;
        const changes = event.changes;

        await postSchedule({
            'id'       : schedule.id,
            'start'    : (changes.start || schedule.start).toDate().getString(true),
            'end'      : (changes.end || schedule.end).toDate().getString(true)
        }, 'update');
        calendar.updateSchedule(schedule.id, schedule.calendarId, changes);
    });

    const postModal = $('.ui.modal#post-schedule');

    const newHeaderElement      = document.getElementById('new-header');
    const updateHeaderElement   = document.getElementById('update-header');

    const idElement         = document.getElementById('id');
    const formElement       = {
        title    : document.getElementById('title'),
        start    : document.getElementById('start'),
        end      : document.getElementById('end'),
        director : document.getElementById('director')
    }
    const directorSelection = $('.ui.dropdown');

    const showModal     = $('.ui.modal#show-schedule');
    const deleteModal   = $('.ui.basic.modal');

    const titleHeaderElement    = document.getElementById('title-header');
    const showStartElement      = document.getElementById('show-start');
    const showEndElement        = document.getElementById('show-end');
    const showDirectorElement   = document.getElementById('show-director');

    const errorElement          = document.getElementById('error-message');
    const errorMessages         = {
        title      : document.getElementById('enter-title'),
        start      : document.getElementById('enter-start'),
        end        : document.getElementById('enter-end'),
        director   : document.getElementById('enter-director'),
        format     : document.getElementById('invalid-datetime')
    }

    function checkDataIsValid(data) {
        let title = true;
        let start = true;
        let end = true;
        let director = true;
        let format = true;

        if (!data.title) {
            title = false;
        }

        if (!data.start) {
            start = false;
        }

        if (!data.end) {
            end = false;
        }

        if (!data.director) {
            director = false;
        }

        const re = /$\d{4}-\d{2}-\d{2}T\d{2}:\d{2}^/;
        if (data.start instanceof String && !data.start.match(re)) {
            format = false;
        }
        if (data.end instanceof String && !data.end.match(re)) {
            format = false;
        }

        if (title && start && end && director) {
            return {
                status  : true
            };
        } else {
            return {
                status   : false,
                valid    : {
                    title    : title,
                    start    : start,
                    end      : end,
                    director : director,
                    format   : format
                }
            };
        }
    }

    function validate(data) {
        const result = checkDataIsValid(data);

        if (result.status) {
            errorElement.hidden = true;
            for (let elem in errorMessages) {
                errorMessages[elem].hidden = true;
            }
            for (let elem in formElement) {
                errorMessages[elem].classList.remove('error');
            }
            return true;
        } else {
            postModal.transition('shake');
            errorElement.hidden = false;

            for (let elem in result.valid) {
                errorMessages[elem].hidden = result.valid[elem];
                formElement[elem] && formElement[elem].classList.add('error');
            }
            return false;
        }
    }

    // Show Schedule
    calendar.on('clickSchedule', async event => {
        const schedule = event.schedule;

        titleHeaderElement.innerText    = schedule.title;
        showStartElement.innerText      = schedule.start.toDate().getString(true);
        showEndElement.innerText        = schedule.end.toDate().getString(true);
        showDirectorElement.innerText   = schedule.body;

        showModal.modal({
            onApprove   : () => {
                // Edit Schedule
                newHeaderElement.remove();

                idElement.value              = schedule.id;
                formElement.title.value      = schedule.title;
                formElement.start.value      = schedule.start.toDate().getString(true);
                formElement.end.value        = schedule.end.toDate().getString(true);
                formElement.director.value   = schedule.body;
                directorSelection.dropdown('set selected', schedule.body);

                postModal.modal({
                    onApprove   : async () => {
                        const data = preprocess($('#post-schedule form.ui.form').serializeArray());
                        if (checkDataIsValid(data)) {
                            const updatedSchedule = await postSchedule(data, 'update');

                            calendar.updateSchedule(schedule.id, schedule.calendarId, updatedSchedule);
                            calendar.render();
                            return true;
                        }
                    },
                    onHidden    : () => {
                        updateHeaderElement.parentElement.insertBefore(newHeaderElement, updateHeaderElement);
                    }
                }).modal('show');
            },
            onDeny      : () => {
                // Delete Schedule
                deleteModal.modal({
                    onApprove   : async () => {
                        await deleteSchedule(schedule.id);
                        calendar.deleteSchedule(schedule.id, schedule.calendarId);
                    }
                }).modal('show');
            }
        }).modal('show');
    });

    // Add Schedule
    document.getElementById('plus-button').onclick = () => {
        updateHeaderElement.remove();

        formElement.start.value  = startTime;
        formElement.end.value    = endTime;

        postModal.modal({
            onApprove   : async () => {
                const data = preprocess($('#post-schedule form.ui.form').serializeArray());
                if (checkDataIsValid(data)) {
                    const resultSchedule = await postSchedule(data);
                    calendar.createSchedules([resultSchedule]);
                }
            },
            onHidden    : () => {
                newHeaderElement.parentElement.insertBefore(updateHeaderElement, newHeaderElement);
            }
        }).modal('show');
    };

    directorSelection.dropdown();
};