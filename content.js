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
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'vocadder-back') {
      port.onMessage.addListener(({type: type}) => {
        if (type === 'addtoNew') {
          let name = getName();
          if (name) port.postMessage({type: 'addtoNew', name: name});
        }
      });
    }
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
        // canceled
      }
}

// outgoing
let port = chrome.runtime.connect({name: 'vocadder'});

// on page init: always check for login state
document.addEventListener('load', () => {
    port.postMessage({
        type: 'checkLogin'
    });
})

document.addEventListener('selectionchange', () => {
    const text = getSelectedText();
    if (text) {
        port.postMessage({
            type: 'selection',
            selection: text
        });
    }
})