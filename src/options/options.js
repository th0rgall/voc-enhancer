const browser = require('webextension-polyfill');
import externalLinks from '../shared/externalLinks';
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/**
 * Creates an checkbox element with given parameters
 * @param {*} name 
 * @param {*} label 
 * @param {*} checked 
 * @return {*} the wrapped input element
 */
function createCheckbox(name, label, checked, changeListener) {
    const checkElement = document.createElement("div");
    checkElement.innerHTML = `<input type="checkbox" id="${name}" name="${name}" ${
            checked ? "checked" : ""
        }>
        <label for="${name}">${label}</label>`;
    const checkInput = checkElement.querySelector("input");
    checkInput.addEventListener("change", (event) => changeListener(checkInput.checked, name));
    return checkElement;
}

window.addEventListener('DOMContentLoaded', (event) => {
    const background = browser.runtime.getBackgroundPage();
    const getDb = () => background.then(bg => bg.db);

    // get external links
    getDb().then(db => {
        db.get("externalLinks").then( (links) => {
            // const optionsSelect = document.getElementById("options-external-links");
            const options = document.getElementById("options-form");
            const externalLinksDiv = document.getElementById("external-links");
            const otherSettingsDiv = document.getElementById("other-settings");
            
            /* external links */
            Object.keys(externalLinks).map(l => {
                let linkInfo = externalLinks[l];
                // let activeLinks = links.slice(); 
                // Mistake: slice creates shallow array copy per checkbox 
                // --> if multiple are clicked, the second overwrites the set w/ by modifying an old version
                let activeLinks = links;
                // make checkboxes
                return createCheckbox(
                    l, linkInfo.title, activeLinks.find(activeLink => activeLink === l), 
                    checked => {
                        // NOTE: this works on version of links first loaded here.
                        // assumes activeLinks does not change. If it might in between
                        // two questions, a db call should be done every time
                        const linkExists = activeLink => activeLink === l;
                        // TODO: take into account order
                        if (checked && !activeLinks.find(linkExists)) {
                            activeLinks.push(l);
                        } else if (!checked && activeLinks.find(linkExists)) {
                            // remove element
                            const ind = activeLinks.findIndex(linkExists);
                            if (ind) {
                                activeLinks.splice(ind, 1);
                            }
                        }
                    // update store
                    db.set("externalLinks", activeLinks.slice());
                });
            }).forEach(el => externalLinksDiv.appendChild(el));

            /* other settings */
            const otherSettings = [
                {
                    label: 'Show translations (in word game, detail page)',
                    type: 'checkbox',
                    key: 'showTranslations'
                },
                {
                    label: 'Show links to external services',
                    type: 'checkbox',
                    key: 'showExternalLinks',
                },
                {
                    label: 'Add a "My Lists" menu entry to the top navigation bar.',
                    type: 'checkbox',
                    key: 'showMyLists',
                },
                {
                    label: 'Show a word-adding popup when selecting on mobile',
                    type: 'checkbox',
                    key: 'showMobileAdd',
                    onlyMobile: true
                },
            ];

            const onChecked = (checked, key) => { db.set(key, checked).catch(console.err);};
            Promise.all(
                otherSettings.filter(s => isMobile || !s.onlyMobile).map(({key, label, type, onlyMobile}) =>
                    db.get(key).then(value => createCheckbox(key, label, value, onChecked))
                )
            ).then(checkElements => checkElements.forEach(checkEl => otherSettingsDiv.appendChild(checkEl)));
            });
    });
});