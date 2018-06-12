
/**
 * Creates a translation DOM element.
 * @param word word to be translated
 */
function createTranslation(word) {

    let defaultLan = 'nl';
    let currentLan = 'nl';

    // create translation element
    const translationEl = document.createElement('div');

    const selectEl = document.createElement('select');
    selectEl.setAttribute('name', 'language-switcher');
    selectEl.style.width = '5rem';
    translationEl.appendChild(selectEl);
    
    const textContainer = document.createElement('p');
    // would like to use .style, but not necessary properties all are available https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Properties_Reference
    textContainer.style.cssText = `
    display: inline;
    font-size: 1.3em;
    font-weight: 300;
    font-style: italic;
    margin-bottom: 0.7em;
    margin-left: 0.7em;

    `;
    translationEl.appendChild(textContainer);
    const translationText = document.createTextNode(``);
    textContainer.appendChild(translationText);

    const injectTranslation = (target) => {
        // insert translation
        translate(word, {from: 'en', to: target}).then(res => {
            translationText.nodeValue = res.text;
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
        "icon": 'icons/ddg.png',
        "getLink": (w) => `https://duckduckgo.com/?q=${encodeURIComponent(w)}&t=ffab&iax=images&ia=images`
    }, {
        "title": 'Google Image Search',
        "icon": 'icons/gi.png',
        "getLink": (w) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(w)}&tbs=imgo:1`
    }, {
        "title": 'GIPHY Image Search',
        "icon": 'icons/giphy.png',
        "getLink": (w) => `https://giphy.com/search/${encodeURIComponent(w)}`

    }, {
        "title": 'YouGlish',
        "icon": 'icons/yg.png',
        "getLink": (w) => `https://youglish.com/search/${encodeURIComponent(w)}`
    }
];

function createLinks(word) {
    const container = document.createElement('span');
    externalLinks.forEach(link => {
        const ref = document.createElement('a');
        ref.href = link.getLink(word);
        ref.target = '_blank';
        ref.rel = 'noopener noreferrer';
        container.appendChild(ref);

        const icon = document.createElement('img');
        icon.src = link.icon;
        ref.appendChild(icon);

    });
    return container;
}