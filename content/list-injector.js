function initialize() {
    // insert translation element
    render('#wordlist', {observe: false}, (wordlist) => {
        const lis = wordlist.querySelectorAll('li');
        for (let i = 0; i < lis.length; i++) {
            const current = lis[i];
            const word = current.getAttribute('word');
            current.insertBefore(createLinks(word), current.children[1]);
        };
    });
}
