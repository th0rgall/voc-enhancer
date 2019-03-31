
import { createTranslation, createLinks } from './element-creator';

function initialize() {
    window.render('.questionPane > div:last-child .blurb-container', {observe: true, rootSelector: '.questionPane'}, (descriptionParent) => {

        function getWord() {
            // get word
            // Jan 17, 19: word not anymore directly in page
            // TODO: first extract last-child, then continue on that...
            let lastChild = document.querySelector('.questionPane > div:last-child');
            let word;
            if (lastChild) {
                // Question type 1: "The meaning of <word> is ..."
                word = lastChild.querySelector('.instructions strong');
                if (word) {
                    return word.innerText;
                } else {
                    // Question type 2: hidden answer + type something question
                    word = lastChild.querySelector('.sentence.complete strong');
                    if (word) {
                        return word.innerText;
                    } else {
                       // Question type 3: hidden answer + multiple choice question
                       word = lastChild.querySelector('.choices .correct .lookup');
                       if (word && word.getAttribute('word')) {
                           return word.getAttribute('word');
                       } else {
                          // Question type 4: choose the best picture for ... possible
                        // TODO: check
                        word = lastChild.querySelector('.word .wrapper');
                        if (word && word.childNodes.length > 1) {
                            return word.childNodes[1].textContent.trim();
                        } else {
                            // Question type 5: "Which would be considered... ?" 
                            word = lastChild.querySelector('.sentence strong');
                            if (word) {
                                return word.innerText;
                            } else {
                                return null;
                            }
                         }
                       }
                    }
                }
            } else {
                throw "Could not access last slide";
            }
        }

        let word = getWord();
        if (word) {
            let quizInjection = document.createElement('div');
            quizInjection.classList.add('ve-quiz-injection');
            quizInjection.appendChild(createTranslation(word));
            //quizInjection.appendChild(createLinks(word));
            createLinks(word).then(result => quizInjection.appendChild(result)).catch(console.log);
            descriptionParent.children[0].insertBefore(
                quizInjection, descriptionParent.querySelector('.more')); 
        } else {
            throw "Could not find word from page";
        }
        });
}

window.initialize = initialize;
