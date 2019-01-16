
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
        if (domPos) pos = JSON.parse(domPos.dataset.progress)[0].pos;

        translate(word, {from: 'en', to: target, pos: pos}).then(res => {

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
        }).catch(err => {
            console.error(err);
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

const externalLinks = [
    {
        "title": 'DuckDuckGo Image Search',
        "icon": 'icons/ddg-favicon.ico',
        "getLink": (w) => `https://duckduckgo.com/?q=${encodeURIComponent(w)}&t=ffab&iax=images&ia=images`
    }, {
        "title": 'Google Image Search',
        "icon": 'icons/google-favicon.ico',
        "getLink": (w) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(w)}&tbs=imgo:1`
    }, {
        "title": 'GIPHY Image Search',
        "icon": 'icons/giphy-favicon.png',
        "getLink": (w) => `https://giphy.com/search/${encodeURIComponent(w)}`

    }, {
        "title": 'YouGlish',
        "icon": 'icons/youglish-favicon.png',
        "getLink": (w) => `https://youglish.com/search/${encodeURIComponent(w)}`
    }
];

function createLinks(word) {
    const container = document.createElement('span');
    container.classList.add('ve-links');
    externalLinks.forEach(link => {
        const ref = document.createElement('a');
        ref.href = link.getLink(word);
        ref.target = '_blank';
        ref.rel = 'noopener noreferrer';
        ref.classList.add('ve-external-link');
        container.appendChild(ref);

        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL(link.icon);
        ref.appendChild(icon);

    });
    return container;
}