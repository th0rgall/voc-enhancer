import { createTranslation, createLinks, windowExporter } from './element-creator';
import browser from 'webextension-polyfill';
windowExporter({key: "initialize", value: initialize });


async function initialize() {
    // import window functions
    const {getSetting, getListIdFromDocUrl, render} = window.vocenhancer;

    let showExamples = await getSetting('showExamples');
    let showExternalLinks = await getSetting('showExternalLinks');
    let showTranslations = await getSetting('showTranslations');

    // preload list examples once if available
    const id = getListIdFromDocUrl();
    let list;
    if (showExamples && id) list = await browser.runtime.sendMessage({
        type: 'getList',
        id
    });

    // render on every new definition
    render('.questionPane > div:last-child .blurb-container', {observe: true, rootSelector: '.questionPane'},
      async (descriptionParent) => {

        let word = getWord();
        if (word) {
            const quizInjection = document.createElement('div');
            quizInjection.classList.add('ve-quiz-injection');

            // inject translation
            if (showTranslations) {
                quizInjection.appendChild(createTranslation(word));
            }

            // inject links
            if (showExternalLinks) {
                const result = await createLinks(word, false, "highlight light-all");
                quizInjection.appendChild(result);
                descriptionParent.children[0].insertBefore(quizInjection, descriptionParent.querySelector('.more')); 
                // [{"word":"zilch","lang":"en",
                // "description":"Added from URL: https://forums.macrumors.com/threads/usb-c-powerba… on Wednesday 6 June 2018 at 14:08.",
                // "example":{"text":"So far, zilch.","offsets":[8,13]},"definition":"a quantity of no importance","shortdefinition":"a quantity of no importance",
                // "audio":["D/15IWYVT54ZU23"],"ffreq":4.6965513531891756E-4}}]
            }

            // inject example
            if (showExamples && list) {
                let listWordObj = list.words.find(listWord => listWord.word === word);
                if (listWordObj && listWordObj.example) {
                    let exampleElement = document.createElement('p');
                    exampleElement.classList.add("ve-example-sentence");
                    // exampleElement.innerText = 
                    // `"${listWordObj.example.text}"`;

                    const extText = listWordObj.example.text;
                    const off = listWordObj.example.offsets; 
                    exampleElement.innerHTML = 
                        `"${extText.slice(0, off[0])}<span class="ve-example-source-word">${
                                extText.slice(off[0], off[1])}</span>${extText.slice(off[1])}"`;

                    // first child is the .blurbPane
                    descriptionParent.children[0].appendChild(exampleElement);

                    let sourceElement = document.createElement('div');
                    sourceElement.classList.add("ve-example-source");
                    // sourceElement.innerText = `— ${list.name}`;
                    sourceElement.innerText = "— example from the list";
                    descriptionParent.children[0].appendChild(sourceElement);
                }
            }
        } else {
            throw "Could not find word from page";
        }
        });
}

/**
 * Function to get a word from the current slide
 */
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