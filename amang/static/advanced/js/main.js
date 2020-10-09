$(() => {
    /* MENU */
    const url = document.URL;
    const re = /.*\/advanced\/([a-z_]*)\/.*/;

    const section = (url.match(re) || ['', 'settings'])[1];
    const menuItem = document.querySelector(`a.item[href="/advanced/${section}/"]`);
    menuItem.classList.add('active');
});