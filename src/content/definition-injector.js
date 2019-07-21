import { createTranslation, createLinks, windowExporter } from './element-creator';
windowExporter({key: "initialize", value: initialize});

async function initialize() {
    // import window functions
    const {getSetting} = window.vocenhancer;
    
    // get word 
    let wordEl = document.querySelector('div[data-word]');
    if (wordEl) {
        let word = wordEl.dataset.word;

        // inject translation element
        if (await getSetting('showTranslations')) {
            const pageContent = document.querySelector('#pageContent');
            let defContainer = pageContent.querySelector('.definitionsContainer');
            defContainer.children[0].insertAdjacentElement('beforebegin', createTranslation(word, 'dark'))
        }

        // inject links
        if (await getSetting('showExternalLinks')) {
            let addToSection = document.querySelector('div.section.tools');
            if (addToSection) {
                createLinks(word, false, "light-all grow").then(resEl => {
                    addToSection.insertAdjacentElement('beforebegin', resEl);
                })
            }
        }
    }
}
