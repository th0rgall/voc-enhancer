import { createLinks, createAudioButton, windowExporter} from './element-creator';
windowExporter(initialize);

function initialize() {
    const wordlist = document.querySelector('#wordlist');
    const lis = wordlist.querySelectorAll('li');
    function forEachLi(f) {
        for (let i = 0; i < lis.length; i++) {
            const current = lis[i];
            const word = current.getAttribute('word');
            f(current, word);
        }
    }

    // insert external service links
    forEachLi((current, word) => {
        // does a lot of things repetitively: cache insite this method
        createLinks(word).then(result => current.insertBefore(result, current.children[1]));;
        // disable source links that won't work anyway
        let link = current.querySelector("a.source");
        if (link && link.getAttribute("href") === "https://corpus.vocabulary.com/go/0") {
            link.classList.add('ve-source-link');
        }
    });

    // insert audio buttons (asynchronous)
    createAudioMap().then(audioMap => {
        forEachLi((current, word) => {
            const wordAnchor = current.querySelector("a.word");
            wordAnchor.insertAdjacentElement("afterend", createAudioButton(audioMap[word]))
        });
    });
}

function createAudioMap() {
    const id = +window.vocenhancer.getListIdFromDocUrl();
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