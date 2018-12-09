
function initialize() {
    render('.questionPane > div:last-child .blurb-container', {observe: true, rootSelector: '.questionPane'}, (descriptionParent) => {

        // get word
        let word = descriptionParent.parentElement.parentElement.parentElement.dataset.word;
        let quizInjection = document.createElement('div');
        quizInjection.classList.add('ve-quiz-injection');
        quizInjection.appendChild(createTranslation(word));
        quizInjection.appendChild(createLinks(word));

        descriptionParent.children[0].insertBefore(
            quizInjection, descriptionParent.querySelector('.more'));
        });
}
