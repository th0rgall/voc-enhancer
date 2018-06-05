
function initialize() {
    render('#pageContent', {observe: true, firstPass: true}, (wordPage) => {

        // get word
        let word = document.querySelector('div[data-word]').dataset.word;
        // TODO: make null resistent

        // insert translation
        translate(word, {from: 'en', to: 'nl'}).then(res => {
            insertTranslation(wordPage, res.text);
        }).catch(err => {
            console.error(err);
        });
    });
}

function insertTranslation(pageContent, translation) {
    let defContainer = pageContent.querySelector('.definitionsContainer');
    // create translation element
    let translationEl = document.createElement('p');
    translationEl.appendChild(document.createTextNode(`NL: ${translation}`));
    // would like to use .style, but not necessary properties all are available https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Properties_Reference
    translationEl.style.cssText = `
        font-size: 1.3em;
        font-weight: 300;
        font-style: italic;
        margin-bottom: 0.7em;
    `;
    defContainer.insertBefore(translationEl, defContainer.children[0]);
}
