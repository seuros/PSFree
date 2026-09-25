function CheckFW() {
    const userAgent = navigator.userAgent;
    // Detection is now console-aware: parseTarget() yields a 0xC_MM_mm target
    // (console bit + BCD firmware) or null. This replaces the old brittle
    // substring/regex on "PlayStation 4" and lets a PS5 be identified instead
    // of falling into the "unknown platform" branch below. See chains.js.
    const target = parseTarget(userAgent);
    user.target = target;
    const fwVersion = targetToFloat(target); // display float, e.g. "11.02"
    var elementsToHide = [
        'ps-logo-container', 'choosejb-initial', 'exploit-main-screen', 'scrollDown',
        'click-to-start-text'
    ];

    if (targetIsPS4(target) || targetIsPS5(target)) {
        user.platform = targetIsPS5(target) ? 'PS5' : 'PS4';

        if (isTargetSupported(target)) {
            ui.ps4FwStatus.style.color = 'green';

            // Highlight firmware in about popup
            var fwElement = "fw" + (fwVersion || '').replace('.', '');
            var el = document.getElementById(fwElement);
            if (el) el.classList.add('fwSelected');

            // show "load userland exploit only on jailbreak" option (PS4 6.7x)
            if (target >= 0x00670 && target <= 0x00672)
                document.getElementById("userlandOnlyOnJB67x").classList.toggle('hidden');

            updateExploitChainVisibility(target);
            autoSelectExploitChain(target);
        } else {
            // Unsupported: an out-of-range PS4, or a PS5 whose firmware has no
            // registered chain yet (every PS5 falls here until a row is added).
            ui.ps4FwStatus.style.color = 'orange';
            if (isHttps()) {
                ui.secondHostBtn[0].style.display = "block";
                terminateCache(); // Dont cache in case no webkit and is https
            } else {
                // modify elements inside elementsToHide for unsupported firmware to load using GoldHEN's PayLoader
                const toRemove = ['exploit-main-screen', 'scrollDown', 'advancedPayloads'];
                elementsToHide = elementsToHide.filter(e => !toRemove.includes(e));
                elementsToHide.push('initial-screen', 'exploit-status-panel', 'henSelection', 'autoJbContainer', 'successRate', 'bareboneJBOption', 'chooseExploitChain');
                document.getElementById('exploitContainer').style.display = "block";

                // Sizing the payload's section
                ui.payloadsSection.style.margin = "auto";
                document.getElementById('header2').classList.remove('hidden');
            }

            elementsToHide.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
        }
        // Legacy PS4 fields (network payload send + fw highlight). Set for PS4
        // ONLY: a PS5 float written here would be misread as a supported PS4 by
        // the isSupportedFw() float shim in payloads.js / language.js.
        if (targetIsPS4(target)) {
            window.ps4Fw = fwVersion;
            user.ip = "127.0.0.1"
            user.ps4Fw = fwVersion;
        }
    } else {
        // Not a PS4
        user.platform = 'Unknown platform';
        if (/Android/.test(userAgent)) user.platform = 'Android';
        else if (/iPhone|iPad|iPod/.test(userAgent)) user.platform = 'iOS';
        else if (/Macintosh/.test(userAgent)) user.platform = 'MacOS';
        else if (/Windows/.test(userAgent)) user.platform = 'Windows';
        else if (/Linux/.test(userAgent)) user.platform = 'Linux';

        // For user selected firmware
        if (user.ps4Fw) ui.ps4FwSelect.value = user.ps4Fw;
        // Show only if on a local server
        if ((isLocalIP(window.location.hostname) || window.location.hostname == "localhost") && !devMode) {
            // Show IP input and firmware selector for local server users on smart devices
            ui.ps4IpInput.classList.remove('hidden');
            ui.ps4FwSelect.classList.remove('hidden');
            ui.scanGoldHENPayLoader.classList.remove('hidden');
            ui.shutdownServerBtn.classList.remove('hidden');
            document.querySelector('.customPayloadsTab').classList.remove('hidden');
            ui.ps4IpInput.value = user.ip;

            const toRemove = ['exploit-main-screen', 'scrollDown', 'advancedPayloads', 'custom-tab'];
            elementsToHide = elementsToHide.filter(e => !toRemove.includes(e));
            elementsToHide.push('initial-screen', 'henSelection', 'autoJbContainer', 'successRate', 'bareboneJBOption', 'chooseExploitChain');

            // Sizing the payload's section
            // Full screen for phones, centered for desktop
            if (user.platform == "Android" || user.platform == "iOS") {
                // hide console
                elementsToHide.push('exploit-status-panel');
                document.getElementById('exploitContainer').style.display = "block";
                ui.exploitScreen.style.padding = "0";
            }
            ui.payloadsSection.style.width = "100%";
            ui.payloadsSection.style.margin = "auto";
            // Moving the settings icon to a better place
            document.getElementById('header2').classList.remove('hidden', 'left-6');
            document.getElementById('header2').classList.add('flex', 'inherit');
            document.getElementById('header2').querySelectorAll('button').forEach((item) => item.classList.add('border', 'border-white/20', 'rounded-xl'))
        }
        ui.ps4FwStatus.style.color = 'red';
        document.getElementById('PS4FW').style.width = "100%";
        document.getElementById('PS4FW').style.textAlign = "center";

        // Hide elements for non supported devices unless in dev mode
        if (!devMode) {
            elementsToHide.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
        }
    }
}

function toggleVisibility(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !show);
}

// Auto-select the best chain for this target on every load, unless the user has
// a deliberate pin that is still valid for the detected firmware.
//  - unpinned                -> bestChainForTarget
//  - pinned but not valid    -> drop pin, re-auto, log it (console/fw changed,
//                               or a PS4 pin carried onto a PS5)
//  - pinned and valid        -> honor it
function autoSelectExploitChain(target) {
    var valid = chainsForTarget(target);
    var pinned = localStorage.getItem('exploitChainPinned') === 'true';
    var current = parseInt(localStorage.getItem('exploitChain'), 10);
    var pinnedValid = pinned && !isNaN(current) &&
        valid.some(function (c) { return c.id === current; });

    if (pinnedValid) {
        user.exploitChain = current; // honor the manual choice
        return;
    }

    if (pinned) {
        localStorage.removeItem('exploitChainPinned');
        if (typeof log === 'function') {
            log("Saved exploit chain isn't valid for this firmware — re-selecting.", "gray");
        }
    }

    var best = bestChainForTarget(target);
    if (best) {
        exploitChain(best.id); // auto path: does NOT pin
    }
}

// Show only the exploit chain radios valid for this target — driven entirely by
// the registry, so adding a chain row lights up its radio with no edit here.
function updateExploitChainVisibility(target) {
    if (target === null || isNaN(target)) return;
    var validIds = {};
    chainsForTarget(target).forEach(function (c) { validIds[c.id] = true; });
    EXPLOIT_CHAINS.forEach(function (c) {
        if (!c.el) return; // chains without a radio (e.g. badhoist)
        toggleVisibility(c.el, !!validIds[c.id]);
    });
}