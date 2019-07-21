if (document.readyState === "complete" ) { 
    initMisc();
} else {
    window.addEventListener('load', initMisc);
}

async function initMisc() {
    const { getSetting } = window.vocenhancer;
    if (await getSetting('showMyLists')) {
        insertListLink();
    }
}

/**
 * 
 */
function insertListLink() {
    let el = document.querySelector("header.page-header ul");
    if (el) {
        const li = document.createElement('li');
        li.classList.add('listsTab');
        li.title = "See your Vocabulary lists";
        li.setAttribute('unselectable', 'on');
        li.style = "-moz-user-select: none;";

        const a = document.createElement('a');
        a.href = '/account/lists';
        const span = document.createElement('span');
        span.appendChild(document.createTextNode('MY LISTS'));
        a.appendChild(span);
        li.appendChild(a);
        el.appendChild(li);
    }
}