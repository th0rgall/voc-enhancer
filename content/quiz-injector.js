
function initialize() {
    render('.questionPane > div:last-child .blurb-container', {observe: true, rootSelector: '.questionPane'}, (descriptionParent) => {

        // get word
        let word = descriptionParent.parentElement.parentElement.parentElement.dataset.word;

        // insert translation
        translate(word, {from: 'en', to: 'nl'}).then(res => {
            insertTranslation(descriptionParent, res.text);
        }).catch(err => {
            console.error(err);
        });
    });

}

function insertTranslation(descriptionParent, translation) {
    // create translation element
    let translationDiv = document.createElement('div');
    translationDiv.appendChild(document.createTextNode(`NL: ${translation}`));
    // would like to use .style, but not necessary properties all are available https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Properties_Reference
    translationDiv.style.cssText = `
        font-size: 1.3em;
        font-weight: 300;
        font-style: italic;
        margin-bottom: 0.7em;
    `;
    descriptionParent.children[0].insertBefore(translationDiv, descriptionParent.querySelector('.more'));
}
