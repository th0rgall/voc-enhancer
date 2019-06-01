import { createTranslation, windowExporter } from './element-creator';
windowExporter(initialize);

function initialize() {
    // insert translation element
    const pageContent = document.querySelector('#pageContent');
    // get word
    let wordEl = document.querySelector('div[data-word]');
    if (wordEl) {
        let word = wordEl.dataset.word;
        let defContainer = pageContent.querySelector('.definitionsContainer');
        defContainer.insertBefore(createTranslation(word, 'dark'), defContainer.children[0]);
    }
}
