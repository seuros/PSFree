// HEN path selection based on user preference
function GoldHEN() {
    sessionStorage.setItem('payload_path', './includes/payloads/GoldHEN/goldhen_v2.4b18.10.bin');
}

function HEN() {
    sessionStorage.setItem('payload_path', './includes/payloads/HEN/HEN.bin');
}

function chooseHEN() {
    if (user.currentJbFlavor === 'HEN') {
        HEN();
    } else GoldHEN();
}

function saveJbFlavor(name, value) {
    localStorage.setItem("jailbreakFlavor", value);
    // Apply hen selector to both inputs
    document.querySelector(`input[name="${name == "hen" ? "hen2" : "hen"}"][value="${value}"]`).checked = true;
    user.currentJbFlavor = value;
};

function loadJbFlavor() {
    const flavor = user.currentJbFlavor || 'GoldHEN';
    const henRadio = document.querySelector(`input[name="hen"][value="${flavor}"]`);
    const hen2Radio = document.querySelector(`input[name="hen2"][value="${flavor}"]`);

    if (henRadio && hen2Radio) {
        henRadio.checked = true;
        hen2Radio.checked = true;
    }
}