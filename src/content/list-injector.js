import { createLinks } from './element-creator';

function initialize() {
    // insert translation element
    render('#wordlist', {observe: false}, (wordlist) => {
        const lis = wordlist.querySelectorAll('li');
        // insert service links
        for (let i = 0; i < lis.length; i++) {
            const current = lis[i];
            const word = current.getAttribute('word');
            createLinks(word).then(result => current.insertBefore(result, current.children[1]));;
            
            // disable source links that won't work anyway
            let link = current.querySelector("a.source");
            if (link && link.getAttribute("href") === "https://corpus.vocabulary.com/go/0") {
                link.classList.add('ve-source-link');
            } 
        };
    });
}

window.initialize = initialize;
