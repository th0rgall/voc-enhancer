
function initialize() {
    // insert translation element
    render('#pageContent', {observe: true, firstPass: true}, (pageContent) => {
        // get word
        let wordEl = document.querySelector('div[data-word]');
        if (wordEl) {
            let word = wordEl.dataset.word;
            let defContainer = pageContent.querySelector('.definitionsContainer');
            defContainer.insertBefore(createTranslation(word, 'dark'), defContainer.children[0]);
        }
    });
}
