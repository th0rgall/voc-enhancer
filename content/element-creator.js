
/**
 * Creates a translation DOM element.
 * @param word word to be translated
 */
function createTranslation(word) {

    let defaultLan = 'nl';
    let currentLan = 'nl';

    // create translation element
    const translationEl = document.createElement('div');
    translationEl.classList.add('ve-translation-container')

    const selectEl = document.createElement('select');
    selectEl.setAttribute('name', 'language-switcher');
    selectEl.classList.add('ve-translation-selector');
    translationEl.appendChild(selectEl);
    
    const textContainer = document.createElement('p');
    textContainer.classList.add('ve-translation');
    translationEl.appendChild(textContainer);
    const translationText = document.createTextNode('');
    textContainer.appendChild(translationText);


    const injectTranslation = (target) => {
        // insert translation

        // get shown PoS
        let domPos = document.querySelector('.challenge-slide:last-child');
        let pos;
        if (domPos) pos = JSON.parse(domPos.dataset.progress)[0].pos;

        translate(word, {from: 'en', to: target, pos: pos}).then(res => {

            const tDispFun = (t) => `${t.translation} (${t.pos})`;

            translationText.nodeValue = tDispFun(res.translations[0]);
            if (res.translations.length > 1) {
                const alts = document.createElement('span');
                alts.classList.add('ve-translation-alternatives');
                alts.appendChild(document.createTextNode(
                    res.translations.slice(1).map(tDispFun).join(', ')
                ));
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
            injectTranslation(e.target.value);
        }
    });

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
        icon.src = chrome.extension.getURL(link.icon);
        ref.appendChild(icon);

    });
    return container;
}