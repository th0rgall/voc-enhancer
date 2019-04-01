const browser = require('webextension-polyfill');
import externalLinks from '../shared/externalLinks';

window.addEventListener('DOMContentLoaded', (event) => {
    const background = browser.runtime.getBackgroundPage();
    const getDb = () => background.then(bg => bg.db);

    // get external links
    getDb().then(db => {
        db.get("externalLinks").then( (links) => {
            // const optionsSelect = document.getElementById("options-external-links");
            const options = document.getElementById("options-form");
            
            Object.keys(externalLinks).map(l => {
                let linkInfo = externalLinks[l];
                // let activeLinks = links.slice(); 
                // Mistake: slice creates shallow array copy per checkbox 
                // --> if multiple are clicked, the second overwrites the set w/ by modifying an old version
                let activeLinks = links;
                // make checkboxes
                const checkElement = document.createElement("div");
                checkElement.innerHTML = `<input type="checkbox" id="${l}" name="${l}" ${
                        activeLinks.find(activeLink => activeLink === l) ? "checked" : ""
                    }>
                    <label for="${l}">${linkInfo.title}</label>`;
                const checkInput = checkElement.querySelector("input");
                
                // change handlers for input
                checkInput.addEventListener("change", (event) => {
                    // NOTE: this works on version of links first loaded here.
                    // assumes activeLinks does not change. If it might in between
                    // two questions, a db call should be done every time
                    const linkExists = activeLink => activeLink === l;
                    // TODO: take into account order
                    if (checkInput.checked && !activeLinks.find(linkExists)) {
                        activeLinks.push(l);
                    } else if (!checkInput.checked && activeLinks.find(linkExists)) {
                        // remove element
                        const ind = activeLinks.findIndex(linkExists);
                        if (ind) {
                            activeLinks.splice(ind, 1);
                        }
                    }
                    // update store
                    db.set("externalLinks", activeLinks.slice());
                });

                return checkElement;
            }).forEach(el => options.appendChild(el));
        }
        );
    });
});