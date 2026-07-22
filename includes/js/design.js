function loadTheme() {
    ui.initialScreen.classList.remove('compact');
    const radioElement = document.querySelector('input[name="theme"][value="index"]');
    if (radioElement) radioElement.checked = true;
}

function loadColor() {
    const radioElement = document.querySelector('input[name="colorTheme"][value="default"]');
    if (radioElement) radioElement.checked = true;
}
