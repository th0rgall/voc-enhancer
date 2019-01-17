
function initialize() {
    render('.questionPane > div:last-child .blurb-container', {observe: true, rootSelector: '.questionPane'}, (descriptionParent) => {

        // get word
        // Jan 17, 19: word not anymore directly in page
        let word = document.querySelector('.questionPane > div:last-child .instructions strong');
        if (!word) {
            // try again, hidden-type question
            word = document.querySelector('.questionPane > div:last-child .sentence.complete strong');
        }
        if (word) word = word.innerText;
        let quizInjection = document.createElement('div');
        quizInjection.classList.add('ve-quiz-injection');
        quizInjection.appendChild(createTranslation(word));
        quizInjection.appendChild(createLinks(word));

        descriptionParent.children[0].insertBefore(
            quizInjection, descriptionParent.querySelector('.more'));
        });
}
