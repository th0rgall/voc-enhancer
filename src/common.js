import { windowExporter } from './content/element-creator';
import browser from 'webextension-polyfill';

windowExporter(
    {key: "render", value: render},
    {key: "renderTo", value: renderTo},
    {key: "getListIdFromDocUrl", value: getListIdFromDocUrl},
    {key: "getSetting", value: getSetting},
    {key: "setSetting", value: setSetting});

if (document.readyState === "complete" ) {
    window.vocenhancer.initialize();
} else {
    window.addEventListener('load', window.vocenhancer.initialize);
}

/**
 * @param selector
 * @param options 
 *      observe: boolean that states whether the renderer should only be called when the selector as a
 *                  mutation target was changed. 
 *              That means that a node was appended or removed from the selected element or its subtree.
 *              default: false
 *      firstPass: boolean that states whether the renderer should be called once before mutations have happened
 *              default: false 
 *      rootSelector: (optional) root element selector to observe on.
 *              default: document
 *              
 * @param renderer function gets passed every individual element that matches the selector
 * 
 * Largely copied from https://github.com/toggl/toggl-button/blob/master/src/scripts/common.js#L117
 */
function render(selector, options, renderer) {
    options = options ? options : {};
    if (options.observe) {
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
        mutations.observe(options.rootSelector ? document.querySelector(options.rootSelector) : document, {childList: true, subtree: true});
    }
    
    if (!options.observe || (options.observe && options.firstPass)) {
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

/**
 * Returns the list id of the practiced list if a specific list is being practiced 
 * (url form: https://www.vocabulary.com/lists/${id}/practice)
 * Otherwise returns false
 */
function getListIdFromDocUrl() {
    let match = /\/lists\/(\d+)(?:\/practice)?/.exec(document.location.pathname);
    if (match) {
        return match[1];
    } else {
        return false;
    }
}

/**
 * Helper to get values of settings from the store in the backend
 */
async function getSetting(key, deflt=true) {
    return await browser.runtime.sendMessage({
        type: 'getDb',
        key,
        default: deflt
    });
}

/**
 * Helper to set values of settings from the store in the backend
 */
async function setSetting(key, value) {
    return await browser.runtime.sendMessage({
        type: 'setDb',
        key,
        value
    });
}
