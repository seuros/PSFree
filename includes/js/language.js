function loadLanguage() {
    const langRadio = document.querySelector(`input[name="language"][value="${user.currentLanguage}"]`);
    if (langRadio) langRadio.checked = true;
    const langScript = document.getElementById("langScript");
    if (langScript) langScript.remove();
    // load language file
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `./includes/js/languages/${user.currentLanguage}.js`;
        script.onload = () => resolve(window.lang);
        script.id = "langScript";
        script.onerror = () => reject(new Error(`Failed to load ${user.currentLanguage}`));
        document.head.appendChild(script);
    });
}

// Update UI langauge
function applyLanguage(lang) {
    user.currentLanguage = lang;
    const strings = window.lang

    if (!strings) {
        console.error(`Language list ${lang} is not available`);
        return;
    }
    /**
     * Safely updates element's textContent only if translation exists and is not empty.
     * @param {HTMLElement} element - The DOM element to update.
     * @param {string} key - The key in the 'strings' object.
     */
    const updateText = (element, key) => {
        const translation = strings[key];
        // Check if element exists, and translation is a non-empty string.
        if (element && translation && typeof translation === 'string' && translation.length > 0) {
            element.textContent = translation;
        }
    };

    /**
     * Safely updates element's title attribute only if translation exists and is not empty.
     * @param {HTMLElement} element - The DOM element to update.
     * @param {string} key - The key in the 'strings' object.
     */
    const updateTitle = (element, key) => {
        const translation = strings[key];
        // Check if element exists, and translation is a non-empty string.
        if (element && translation && typeof translation === 'string' && translation.length > 0) {
            element.title = translation;
        }
    };

    // Document Properties
    document.title = strings.title || "PSFree Enhanced";
    document.dir = 'ltr';
    ui.consoleElement.dir = document.dir;
    document.lang = user.currentLanguage;


    // PS4 Firmware Status Check
    const ps4Fw = window.ps4Fw;

    if (ps4Fw === undefined) {
        if (strings.notPs4 && strings.notPs4.length > 0) {
            ui.ps4FwStatus.textContent = strings.notPs4 + user.platform;
        }
    } else if (ps4Fw <= 9.60 && ps4Fw >= 6.70) {
        if (strings.ps4FwCompatible && strings.ps4FwCompatible.length > 0) {
            ui.ps4FwStatus.textContent = strings.ps4FwCompatible.replace('{ps4fw}', ps4Fw);
        }
    } else {
        if (strings.ps4FwIncompatible && strings.ps4FwIncompatible.length > 0) {
            ui.ps4FwStatus.textContent = strings.ps4FwIncompatible.replace('{ps4fw}', ps4Fw);
        }
    }

    // Main Screen Elements
    updateTitle(ui.settingsBtn, 'settingsBtnTitle');
    updateText(ui.clickToStartText, 'clickToStart');

    updateText(document.querySelector('#choosejb-initial h3'), 'chooseHEN');

    // About Us Popup
    if (ui.aboutPopup) {
        updateText(ui.aboutPopup.querySelector('h2'), 'aboutPsfreeHeader');
        var aboutParagraphs = ui.aboutPopup.querySelectorAll('p');
        if (aboutParagraphs.length > 0) updateText(aboutParagraphs[0], 'aboutVersion');
        if (aboutParagraphs.length > 1) updateText(aboutParagraphs[1], 'aboutDescription');
        updateText(ui.aboutPopup.querySelector('#PS4FWOK h3'), 'ps4FirmwareSupportedHeader');
        updateText(ui.aboutPopup.querySelector('#close-about'), 'closeButton');
        updateText(ui.aboutPopup.querySelector('#goldhenFirmwareSemiSupported i'), 'goldhenFirmwareSemiSupported');
        updateText(ui.aboutPopup.querySelector('#infoProtip'), 'infoProtip');
    }
    updateText(ui.bareboneJbBtn, 'bareboneJB')

    // Fan Threshold
    if (ui.chooseFanThreshold) {
        updateText(ui.chooseFanThreshold.querySelector('#close-fanChoose'), 'closeButton');
        updateText(ui.chooseFanThreshold.querySelector('h2'), 'fanTitle');
        updateText(ui.chooseFanThreshold.querySelector('p'), 'fanDescription');
        updateText(ui.chooseFanThreshold.querySelector('h3'), 'selectTemp');
    }
    updateText(document.getElementById('defaultTemp'), 'default');

    // Settings Popup 
    if (ui.settingsPopup) {
        updateText(ui.settingsPopup.querySelector('h2'), 'settingsPsfreeHeader');
        updateText(ui.settingsPopup.querySelector('#close-settings'), 'closeButton');
        updateText(ui.settingsPopup.querySelector('#ghVer'), 'ghVer');
        var ghOtherVer = ui.settingsPopup.querySelector('#chooseGoldHEN summary');
        if (ghOtherVer) updateText(ghOtherVer, 'otherVer');
        updateText(ui.settingsPopup.querySelector('#latestVer'), 'latestVer');
        updateText(ui.settingsPopup.querySelector('#scanPayLoader'), 'scanPayLoader');
        updateText(ui.settingsPopup.querySelector('#shutdownServerBtn'), 'shutdownServerBtn');
    }
    updateText(document.getElementById('showAdvancedPayloads'), 'showAdvancedPayloads');
    updateText(document.getElementById('optionsHeader'), 'optionsHeader');
    updateText(document.getElementById('modularLapse'), 'modularLapse');
    updateText(document.getElementById('bundleLapse'), 'bundleLapse');
    updateText(document.getElementById('autoJbRetryText'), 'autoJbRetryText');
    updateText(ui.exploitChainTitle, 'exploitChainTitle');
    updateText(document.getElementById('userlandOnlyOnJB67xText'), 'userlandOnlyOnJB67x')
    if (isHttps()) {
        ui.secondHostBtn[1].style.display = "block";
    }

    // --- Buttons ---
    updateText(ui.secondHostBtn[0], 'secondHostBtn');
    updateText(ui.secondHostBtn[1], 'secondHostBtn');
    updateTitle(ui.exploitRunBtn, 'clickToStart')
    updateTitle(ui.aboutBtn, 'aboutMenu');

    updateText(document.querySelector('#exploit-status-panel div h2'), 'exploitStatusHeader');
    updateText(ui.successRateText, 'successRate');
    updateText(ui.payloadsSectionTitle, 'payloadsHeader');
    updateText(ui.toolsTab, 'payloadsToolsHeader');
    updateText(ui.linuxTab, 'payloadsLinuxHeader');
    updateText(ui.advancedPayloadsTab, 'advanced');
    updateText(ui.consoleElement.querySelector('center'), 'waitingUserInput');

    document.getElementById('defaultTempDiv').style.float = "right";
}