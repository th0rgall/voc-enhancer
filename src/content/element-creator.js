import externalLinks from "../shared/externalLinks.js";
import {langs} from "../api/languages.js";
import translate from "../api/translate.js";
import browser from 'webextension-polyfill';
import Db from "../api/store";
const db = new Db();

/**
 * Creates a translation DOM element.
 * @param word word to be translated
 */
function createTranslation(word, color) {

    let defaultLan = 'nl';
    let currentLan = 'nl';
    let persistedLan = localStorage.getItem("defaultTargetLan");
    if (persistedLan) {
        defaultLan = persistedLan;
        currentLan = persistedLan;
    } 

    // create translation element
    const translationEl = document.createElement('div');
    translationEl.classList.add('ve-translation-container')

    const selectEl = document.createElement('select');
    selectEl.setAttribute('name', 'language-switcher');
    selectEl.classList.add('ve-translation-selector');
    translationEl.appendChild(selectEl);

    const langLable = document.createElement('span');
    selectEl.classList.add('ve-translation-label');
    langLable.appendChild(document.createTextNode(''));
    
    const textContainer = document.createElement('p');
    textContainer.classList.add('ve-translation');
    translationEl.appendChild(textContainer);
    const translationText = document.createTextNode('');
    textContainer.appendChild(langLable);
    textContainer.appendChild(translationText);


    const injectTranslation = (target) => {
        // insert translation

        // get shown PoS
        let domPos = document.querySelector('.challenge-slide:last-child');
        let pos;
        // Jan 17, 19:TODO: fix pos by using api, progress no longer in page
        if (domPos && domPos.dataset.progress) pos = JSON.parse(domPos.dataset.progress)[0].pos;

        chrome.runtime.sendMessage({
            type: 'translation',
            args: [word, {from: 'en', to: target, pos: pos}]
        }, (res) => {

            const tDispFun = (t) => {
                if (t.pos) {
                    return `${t.translation} (${t.pos})`;
                } else return t.translation;
            }
            const tAlts = (t) => { if (t.alternatives) return `Alternatives:\n${t.alternatives.join('\n')}`};


            // primary translation
            translationText.nodeValue = tDispFun(res.translations[0]);
            textContainer.title = tAlts(res.translations[0]);
            // adjust label
            langLable.childNodes[0].nodeValue = `${target.toUpperCase()}: `;
           
            // remove previous alt translations
            let prevAlts = document.querySelector('.challenge-slide:last-child .ve-translation-alternatives');
            if (prevAlts) {
                prevAlts.remove();
            }

            // add additional translations
            if (res.translations.length > 1) {
                const alts = document.createElement('span');
                alts.classList.add('ve-translation-alternatives');
                if (color && color === 'dark') {
                    alts.classList.add('ve-translation-alternatives-dark');
                }

                let altTrans = res.translations.slice(1)
                .map((trans, i, a) => {
                    if (trans) {
                        const span = document.createElement('span');
                        let spanText = tDispFun(trans);
                        if (i !== (a.length - 1))  spanText += ', ';
                        span.appendChild(document.createTextNode(spanText));
                        span.title = tAlts(trans); 
                        return span;
                    } else {
                        return undefined;
                    }
                }).forEach(span => {if (span) return alts.appendChild(span)});
                textContainer.appendChild(alts);
            }
        });
    }

    // insert options
    Object.keys(langs).forEach(code => {
        const optionEl = document.createElement('option');
        optionEl.setAttribute('value', code);
        const optionText = document.createTextNode(langs[code]);
        if (code === defaultLan) {
            optionEl.setAttribute('selected', '');
        }
        optionEl.appendChild(optionText);
        selectEl.appendChild(optionEl);
    });

    selectEl.addEventListener('change', (e) => {
        const selectedLan = e.target.value;
        if (selectedLan !== currentLan) {
            currentLan = selectedLan;
            localStorage.setItem("defaultTargetLan", currentLan);
            injectTranslation(e.target.value);

        }
        // hide the element & show label
        selectEl.style.display = 'none';
        langLable.style.display = 'inline';
    });

    langLable.addEventListener('click', (e) => {
        selectEl.style.display = 'inline';
        langLable.style.display = 'none';
    })

    injectTranslation(defaultLan);

    return translationEl;
}

/**
 * 
 * @param {*} word 
 * @param {*} showEdit 
 * @param {*} modifiers space delimited list of css modifiers to add
 *                      grow, light-all, highlight
 */
async function createLinks(word, showEdit = false, modifiers = "") {
    modifiers = modifiers.split(" ").map(s => s.trim());
    const container = document.createElement('span');
    container.classList.add('ve-links');
    modifiers.forEach(mod => container.classList.add("ve-links--" + mod));
    const links = await db.get("externalLinks");

    Object.keys(externalLinks)
        .filter(k => 
            links.find(e => e === k)
        )
        .map(k => externalLinks[k]).forEach(link => {
            const ref = document.createElement('a');
            ref.href = link.getLink(word);
            ref.target = '_blank';
            ref.rel = 'noopener noreferrer';
            ref.classList.add('ve-external-link');
            ref.setAttribute("title", link.title);
            container.appendChild(ref);

            const icon = document.createElement('img');
            icon.src = chrome.runtime.getURL(link.icon);
            ref.appendChild(icon);

        });

        if (showEdit) {
            const ref = document.createElement('a');
            ref.addEventListener("click", () => {
                browser.runtime.sendMessage({
                    type: 'openOptions'
                }).then().catch(() => alert(`Could not open the options page to edit your source links!
                Try navigating to the options via the web browser settings, or contact the developer for help.`));
            });

            ref.classList.add('ve-external-link', 've-vocab-symbol', 've-external-link--options');
            ref.textContent = "⚙️";
            ref.setAttribute("title", "Choose source links");

            const sep = document.createElement('span');
            sep.classList.add('ve-external-link-seperator');
            container.appendChild(sep);
            container.appendChild(ref);
        }

        return container;
}

/**
 * 
 * @param {string} audioCode 
 */
function createAudioButton(audioCode) {
    // Somehow vocab.com has js in place that will detect a newly added
    // audio <a> element, and bind the necessary event. Cool.
    // Pure replication of the definition page.
    const a = document.createElement("a");
    a.dataset.audio = audioCode;
    a.classList.add("audio", "ve-audio");
    return a;
}

function windowExporter(...args) {
    console.log(args);
    // assumed args are function to be put in te window.vocenhancer
    // problem: in production these function names are optimized out -> can't use f.name
    // const fObject = args.reduce((acc, f) => ({...acc, [f.name]: f}), {});
    const fObject = args.reduce((acc, fWrapper) => ({...acc, [fWrapper.key]: fWrapper.value}), {});
    if (window.vocenhancer) {
        Object.assign(window.vocenhancer, fObject);
    } else {
        window.vocenhancer = fObject;
    }
}

export {
    createTranslation,
    createLinks,
    createAudioButton,
    windowExporter
}