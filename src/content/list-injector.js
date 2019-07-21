import { createLinks, createAudioButton, windowExporter} from './element-creator';
import browser from 'webextension-polyfill';
windowExporter({key: "initialize", value: initialize });

async function initialize() {
    // import window functions
    const { getSetting } = window.vocenhancer;

    const wordlist = document.querySelector('#wordlist');
    const lis = wordlist.querySelectorAll('li');
    function forEachLi(f) {
        for (let i = 0; i < lis.length; i++) {
            const current = lis[i];
            const word = current.getAttribute('word');
            f(current, word);
        }
    }

    if (await getSetting('showExternalLinks')) {
        // insert external service links
        forEachLi((current, word) => {
            // does a lot of things repetitively: cache insite this method
            createLinks(word, true, "").then(result => {
                // create a collapse container
                const collapseContainer = document.createElement("div");
                collapseContainer.classList.add("ve-source-link-collapse");


                const collapseLink = document.createElement("a");
                collapseLink.classList.add("ve-source-link-collapse-link", "ve-source-link-collapse-button", "ve-vocab-symbol");
                collapseLink.textContent = "🔗";
                
                const collapseButton = document.createElement("a");
                collapseButton.classList.add("ve-source-link-collapse-button", "ve-vocab-symbol");
                collapseButton.textContent = "▶️";
                collapseContainer.appendChild(result);

                // const collapseButtonWrapper = document.createElement("div");
                // collapseButtonWrapper.classList.add("ve-source-link-collapse-button-wrapper");
                // collapseButtonWrapper.appendChild(collapseButton);


                collapseButton.addEventListener("click", () => {
                    collapseContainer.classList.toggle("active");
                    result.style.transform = collapseContainer.classList.contains("active") ?
                        "translateX(0px)" : `translateX(-${result.offsetWidth}px)`;
                    collapseButton.classList.toggle("active");
                });

                const def = current.querySelector("div.definition");
                current.insertBefore(collapseLink, def);
                current.insertBefore(collapseButton, def);
                current.insertBefore(collapseContainer,def);

                // do transformation after adding
                // collapseContainer.style.width = `${result.offsetWidth}px`;
                collapseContainer.style.width = `500px`;
                result.style.transform = `translateX(-${result.offsetWidth}px)`;
            });

            // disable source links that won't work anyway
            let link = current.querySelector("a.source");
            if (link && link.getAttribute("href") === "https://corpus.vocabulary.com/go/0") {
                link.classList.add('ve-source-link');
            }
        });
    }

    if (await getSetting('showAudio')) {    // insert audio buttons (asynchronous)
        createAudioMap().then(audioMap => {
            forEachLi((current, word) => {
                const wordAnchor = current.querySelector("a.word");
                wordAnchor.insertAdjacentElement("afterend", createAudioButton(audioMap[word]))
            });
        });
    }
}

/**
 * Creates an object that maps the current voc list words to audio keys
 */
function createAudioMap() {
    const { getListIdFromDocUrl } = window.vocenhancer;

    const id = +getListIdFromDocUrl();
    return browser.runtime.sendMessage({
        type: 'getList', id
    }).then(
        apiList => 
            apiList.words.reduce((acc, wordObject) => {
                if (wordObject && wordObject.audio && wordObject.word) {
                    acc[wordObject.word] = wordObject.audio;
                }; 
                return acc;
           }, {})
    )
    .catch(console.err);
}