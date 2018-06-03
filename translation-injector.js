

if (document.readyState === "complete" ) { 
    initialize();
} else {
    window.addEventListener('load', initialize);
}


/**
 * @param selector
 * @param observe boolean that states whether the renderer should only be called on a changed selector.
 *                  changed atm means that a node was appended or removed from a selected element
 * @param renderer function gets passed every individual element that matches the selector
 * @param root (optional) root element selectorto observe on
 * 
 * Largely copied from https://github.com/toggl/toggl-button/blob/master/src/scripts/common.js#L117
 */
function render(selector, observe, renderer, rootSelector) {
    if (observe) {
        let mutations = new MutationObserver((mutations) => { 
            let matches = mutations.filter(
                (mutation) => {
                    return mutation.target.matches(selector);
                }
            
            );
            if (matches.length) {
                renderTo(selector, renderer);
            }
           });
        // TODO: subtree misschien niet nodig
        mutations.observe(rootSelector ? document.querySelector(rootSelector) : document, {childList: true, subtree: true});
    } else {
        renderTo(selector, renderer);
    }
}

/**
 * Plainly copied from https://github.com/toggl/toggl-button/blob/master/src/scripts/common.js#L140
 */
function renderTo(selector, renderer) {
    var i, len, elems = document.querySelectorAll(selector);
    for (i = 0, len = elems.length; i < len; i += 1) {
      elems[i].classList.add('voc-enhancer');
    }
    for (i = 0, len = elems.length; i < len; i += 1) {
      renderer(elems[i]);
    }
  }

function initialize() {
    render('.questionPane > div:last-child .blurb-container', true, (descriptionParent) => {

        // get word
        let word = descriptionParent.parentElement.parentElement.parentElement.dataset.word;

        // insert translation
        translate(word, {from: 'en', to: 'nl'}).then(res => {
            insertTranslation(descriptionParent, res.text);
        }).catch(err => {
            console.error(err);
        });
    }, '.questionPane');

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
