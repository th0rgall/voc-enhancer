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

document.addEventListener('selectionchange', () => {
    const text = getSelectedText();
    if (text) {
        chrome.runtime.sendMessage({
            type: 'selection',
            selection: text
        });
    }
})