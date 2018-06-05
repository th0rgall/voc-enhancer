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
      }
    };
    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});
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
      let sentenceReg = new RegExp(`(\\.\\s{1,3}|[^\\s][A-Z])[^\\.]*(${regWord}|${regWordDecapitated})[^\\.]*\\.`);


      let sentence = selectionNode.textContent;
      let hopCount = 0;
      let match = sentenceReg.exec(sentence);
      while (sentence && !match && hopCount < 5) {
        selectionNode = selectionNode.parentElement;
        sentence = selectionNode.textContent;
        match = sentenceReg.exec(sentence);
        hopCount++;
      }

      if (match)  {
          // might have matched too much. A second pass in order to keep the regex above cleaner...
          const rawMatch = match[0];
          let fineMatch = /\.\s{1,3}(.*)/.exec(rawMatch);
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

document.addEventListener('selectionchange', ()=> {
    const text = getSelectedText();
    if (text) {
        chrome.runtime.sendMessage({
            type: 'selection',
            selection: text,
            sentence: getSurroundingSentence()
        });
    }
})