
function initialize() {
    render('.questionPane > div:last-child .blurb-container', {observe: true, rootSelector: '.questionPane'}, (descriptionParent) => {

        // get word
        let word = descriptionParent.parentElement.parentElement.parentElement.dataset.word;
        descriptionParent.children[0].insertBefore(
            createTranslation(word), descriptionParent.querySelector('.more'));
        });
}
