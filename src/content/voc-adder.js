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
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!sender.tab) { // message from extension
      if (request.type === 'addtoNew') {
        let name = getName();
        if (name) sendResponse({type: 'addtoNew', name: name});
      } else if (request.type === 'sentence') {
          sendResponse({
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
    chrome.runtime.sendMessage({
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
      let sentenceReg = new RegExp(`(\\.\\s{1,3}|([^\\s]|^)[A-Z])[^\\.]*(${regWord}|${regWordDecapitated})[^\\.]*\\.`);


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
    chrome.runtime.sendMessage({
        type: 'checkLogin'
    });
    const text = getSelectedText();
    if (text) {
        // TODO: this is initiated for every selection now.
        // Is there no context-menu event in the background that spawns when context menu's can still be modified?
        // Then it could be requested.
        chrome.runtime.sendMessage({
            type: 'selection',
            selection: text,
        });
    }
})