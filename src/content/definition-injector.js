import { createTranslation, createLinks, windowExporter } from './element-creator';
windowExporter({key: "initialize", value: initialize});

function initialize() {
    // get word 
    let wordEl = document.querySelector('div[data-word]');
    if (wordEl) {
        let word = wordEl.dataset.word;

        // inject translation element
        const pageContent = document.querySelector('#pageContent');
        let defContainer = pageContent.querySelector('.definitionsContainer');
        defContainer.children[0].insertAdjacentElement('beforebegin', createTranslation(word, 'dark'))

        // inject links
        let addToSection = document.querySelector('div.section.tools');
        if (addToSection) {
            createLinks(word, false, "light-all grow").then(resEl => {
                addToSection.insertAdjacentElement('beforebegin', resEl);
            })
        }
    }
}
