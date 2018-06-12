
function initialize() {
    // insert translation element
    render('#pageContent', {observe: true, firstPass: true}, (wordPage) => {
        // get word
        let word = document.querySelector('div[data-word]').dataset.word;
        // TODO: make null resistent
        let defContainer = pageContent.querySelector('.definitionsContainer');
        defContainer.insertBefore(createTranslation(word), defContainer.children[0]);
    });
}
