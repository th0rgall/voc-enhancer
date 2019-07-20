const browser = require('webextension-polyfill');

function getSelectedText() {
    let selection = null;
    if (window.getSelection) {
      selection = window.getSelection().toString();
    } else if (document.getSelection) {
      selection = document.getSelection().toString();
    } else if (document.selection) {
      selection = document.selection.createRange().text;
    } 
    return selection;
}

// incoming connection
browser.runtime.onMessage.addListener(
  function(request, sender) {
    if (!sender.tab) { // message from extension
      if (request.type === 'addtoNew') {
        let name = getName();
        if (name) return Promise.resolve({type: 'addtoNew', name: name});
      } else if (request.type === 'sentence') {
          return Promise.resolve({
            type: 'sentence', 
            sentence: getSurroundingSentence(), 
            location: window.location.href,
            title: document.title ? document.title : undefined
          });
      }
    };
  });

function getName() {
    let name = prompt("Name of the new list:")
    if (name) {
        if (name.trim()) {
          return name.trim();
        } else {
          alert("Fill in a non-empty name. Try again.");
        }
      } else {
        // cancelled
      }
}

// on page init: always check for login state
document.addEventListener('load', () => {
    browser.runtime.sendMessage({
        type: 'checkLogin'
    });
})

/**
 * @returns the sentence if found, null otherwise
 */
function getSurroundingSentence() {
  if (!document.selection) { // anti IE 
      const word = getSelectedText();
      let selectionNode = window.getSelection().anchorNode;

      const escapeRegExp = function(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      }
      const regWord = escapeRegExp(word);
      const regWordDecapitated = regWord.substring(1);
      // could probably be improved.
      // Sentence starts with a capital letter and ends with a period. 
      // (but what if a capital name enters somewhere?...) --> lookbehind could be a solution, but not supported
      // for the moment: [^\s] : no space before the capital letter
      // to be tolerant: sentence can also start at the end of another sentence
      // TODO: trim in between
      const interpunction = '\\.\\?!';
      const notInterpunction = `[^${interpunction}];`
      let sentenceReg = new RegExp(`(\\.\\s{1,3}|([^\\s]|^)[A-Z])${notInterpunction}*(${regWord}|${regWordDecapitated})${notInterpunction}*${interpunction}`);

      let sentence = selectionNode.textContent;
      let hopCount = 0;
      let match = sentenceReg.exec(sentence);
      while (sentence && !match && hopCount < 3) {
        selectionNode = selectionNode.parentElement;
        sentence = selectionNode.textContent;
        match = sentenceReg.exec(sentence);
        hopCount++;
      }

      if (match)  {
          // might have matched too much. A second pass in order to keep the regex above cleaner...
          let rawMatch = match[0];
          // clean up match: replace line breaks between letters
          rawMatch = rawMatch.replace(/\w[\n\r]\w/g, (x) => {
            return x[0] + ' ' + x[x.length - 1];
          });
          // clean up match: remove line breaks in general
          rawMatch = rawMatch.replace(/[\n\r]/g, ' ');
          // . does not match newlines! [\s\S] matches everything
          let fineMatch = /^\.\s{1,3}([\s\S]*)$/.exec(rawMatch);
          if (fineMatch) {
            return fineMatch[1];
          } else {
            return rawMatch
          }
      } else {
        return null;
      }
  }
}

document.addEventListener('selectionchange', () => {
    // TODO: this check every time. Is that necessary?
    browser.runtime.sendMessage({
        type: 'checkLogin'
    });
    const text = getSelectedText();
    if (text) {
        // TODO: this is initiated for every selection now.
        // Is there no context-menu event in the background that spawns when context menu's can still be modified?
        // Then it could be requested.
        browser.runtime.sendMessage({
            type: 'selection',
            selection: text,
        });
    }
})

/* MOBILE WORD ADD INSERT */

// only add when 
// 1. on mobile
// 2. user wants to see the popup ("Never" was not tapped)
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var showMobileAdd = true;
if (isMobile) {
  browser.runtime.sendMessage({
    type: 'getDb',
    key: 'showMobileAdd',
    default: showMobileAdd
  }).then( val => {
    showMobileAdd = val;
    if (showMobileAdd) insertMobileAdd();
  });
};

function toggleMobileAdd(mobileAdd) {
  mobileAdd.classList.toggle('ve-mobile-add--visible');
}

function mobileAddIsOpen(mobileAdd) {
  return mobileAdd.classList.contains('ve-mobile-add--visible');
}

function createMobileAdd() {
  /* ----  set-up ---- */
  const mobileAdd = document.createElement("div");
  mobileAdd.classList.add("ve-mobile-add");
  mobileAdd.dataset.isOpening = false;
  // bottom container
  const bot = document.createElement('div');
  bot.classList.add('ve-mobile-add__bottom');
  mobileAdd.insertAdjacentElement('beforeend', bot);
  // left icon
  const icon = document.createElement('img');
  icon.classList.add("ve-mobile-add__icon");
  icon.src = browser.runtime.getURL('icons/favicon-64x64.png');
  bot.insertAdjacentElement('afterbegin', icon);
  // button
  const mobileAddBtn = document.createElement("button");
  mobileAddBtn.appendChild(document.createTextNode("Add word"));
  // select el
  const selectEl = document.createElement('select');
  selectEl.setAttribute('name', 'list-selector');
  selectEl.classList.add('list-selector');
  // right container
  const right = document.createElement("div");
  right.classList.add("ve-mobile-add__right")
  right.appendChild(selectEl);
  right.appendChild(mobileAddBtn);
  bot.insertAdjacentElement('beforeend', right);

  const topHTML = `
    <div class="ve-mobile-add__label">Vocabulary.com Enhancer</div>
    <div class="ve-mobile-add__top">
      <span class="ve-mobile-add__infotext">Add "<span class="ve-mobile-add__selection"></span>" to a list?</span>
      <span class="ve-mobile-add__deny"><div></div><span class="ve-mobile-add__not-now">Not now</span><span class="ve-mobile-add__never">Never</span></span>
    </div>
    `;
  mobileAdd.insertAdjacentHTML('afterbegin', topHTML);

  /* ----  attach behavior ---- */
  // insert select options 
  browser.runtime.sendMessage({
    type: 'getLists'
  }).then(res => {
    res.forEach(wordList => {
      const optionEl = document.createElement('option');
      optionEl.setAttribute('value', wordList.wordlistid);
      const optionText = document.createTextNode(wordList.name);
      optionEl.appendChild(optionText);
      selectEl.appendChild(optionEl);
    });
  });

  // add button click handler
  mobileAddBtn.addEventListener('click', () => {
    browser.runtime.sendMessage({
      type: 'addText',
      selection: getSelectedText(),
      wordListId: selectEl.value
    });
    // TODO: remove popup
  });

  // not now 
  mobileAdd.querySelector('.ve-mobile-add__not-now')
    .addEventListener('click', () => toggleMobileAdd(mobileAdd));

  // never
  mobileAdd.querySelector('.ve-mobile-add__never')
    .addEventListener('click', () => {
      toggleMobileAdd(mobileAdd);
      // persist the never setting
      showMobileAdd = false; // in current session
      browser.runtime.sendMessage({
        type: 'setDb',
        key: 'showMobileAdd',
        value: false
      }).then(
        // todo: send notification / confirmation?
      );
    });
  return mobileAdd;
}

/** 
 * inserts a popup at the bottom of the screen
 */
function insertMobileAdd() {
  /* Mobile adding of selected words */
  const mobileAdd = createMobileAdd();

  document.addEventListener('selectionchange', () => {
    // // TODO: this check every time. Is that necessary?
    // browser.runtime.sendMessage({
    //     type: 'checkLogin'
    // });
    let text = getSelectedText();
    text = text && text.trim().slice(0,100);
    // open mobile add. showMobileAdd => check whether not disabled before
    if (text && !mobileAddIsOpen(mobileAdd) && showMobileAdd) {
        mobileAdd.querySelector('.ve-mobile-add__selection').innerText = text;
        toggleMobileAdd(mobileAdd);
        mobileAdd.dataset.isOpening = true;
        const transitionListener = (e) => {
          if (e.propertyName == "transform") {
            mobileAdd.dataset.isOpening = false;
            mobileAdd.removeEventListener('transitionend', transitionListener);
          };
        }
        mobileAdd.addEventListener('transitionend', transitionListener);
    } else if (text && mobileAddIsOpen(mobileAdd)) {
      // update selection
      mobileAdd.querySelector('.ve-mobile-add__selection').innerText = text;
    }
  });

  // toggle when clicked outside of the popup (~ not now)
  document.body.addEventListener('mousedown', (e) => {
    if (!mobileAdd.contains(e.target) 
        && mobileAddIsOpen(mobileAdd)
        && !(mobileAdd.dataset.isOpening == true)) {
      toggleMobileAdd(mobileAdd)
    }
  })

  // insertion
  document.body.insertAdjacentElement('beforeend', mobileAdd);
}