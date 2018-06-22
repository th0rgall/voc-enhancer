
function initialize() {
    // insert translation element
    render('#pageContent', {observe: true, firstPass: true}, (wordPage) => {
        // get word
        let wordEl = document.querySelector('div[data-word]');
        if (wordEl) {
            let word = wordEl.dataset.word;
            let defContainer = pageContent.querySelector('.definitionsContainer');
            defContainer.insertBefore(createTranslation(word), defContainer.children[0]);
        }
    });
}
