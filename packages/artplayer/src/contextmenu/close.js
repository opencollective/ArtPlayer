export default function close(menuOption) {
    return art => ({
        ...menuOption,
        html: art.i18n.get('Close'),
        click: contextmenu => {
            contextmenu.show = false;
        },
    });
}
