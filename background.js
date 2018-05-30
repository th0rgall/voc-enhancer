// set up VocAPi

let vocapi = new VocAPI();

logError = (err) => {
  console.log(err);
}

function checkLogin() {
  vocapi.checkLogin()
  .then(() => {
    chrome.contextMenus.remove("login");
    createContextMenus();
  })
  .catch((err) => {
      // create a context menu to redirect to a login page
      chrome.contextMenus.create({id: "login", title: "Log in to voc.com to save words", onclick: () => {
        chrome.tabs.create({url: 'https://www.vocabulary.com/login'});
      }});
      logError(err);
  });
}

// incoming connection
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'vocadder') {
    port.onMessage.addListener(({type: type, selection: selection}) => {
      if (type === 'checkLogin') {
        checkLogin();
      } else if (type === 'selection') {
        checkSelection(selection);
      }
    });
  }
});

// outgoing connection
let outPort;

loggedIn = false;
checkLogin();


const addToText = "voc.com: add '%s' to...";

// create "add to" context menus
function createContextMenus() {

  vocapi.getLists()
  .then((lists) => {
    chrome.contextMenus.create({id: "addtoParent", title: addToText, contexts: ["selection"]});
    // create "start learning" context menu
    chrome.contextMenus.create({id: "learnvoc", parentId: "addtoParent", title:"Just Start Learning", contexts: ["selection"], 
    onclick: startLearning});
    // separator
    chrome.contextMenus.create({id: "sep", parentId: "addtoParent", type: "separator", contexts: ["selection"]});
    // add list entries
    lists.forEach((wordList) => {
      chrome.contextMenus.create({id: `addto-${wordList.name}`, 
      title: `${wordList.name} (${wordList.wordcount})`, parentId: "addtoParent", contexts: ["selection"], onclick: addToF(wordList.wordlistid)})
    });
    // separator 2
    chrome.contextMenus.create({id: "sep2", parentId: "addtoParent", type: "separator", contexts: ["selection"]});
    // add to new list entry
    chrome.contextMenus.create({id: "addtoNew", parentId: "addtoParent", title: "Add to a new list...", contexts: ["selection"], onclick: addToNewHandler});
  })
  .catch(logError);
}

function parseVoclist(inputStr) {
	/* 
	* start of string
	* greedy whitespace
	* word
	* greedy whitespace
	* optional extension (= description and/or example):
	*  -: start of extension
	*  description: everything except , (one line mode) or newlines
	*  also optional: example, signaled by a quote
	*/
	let reg = /\s*(\w+|'([^']+)')\s*(-\s*([^,\r\n]*))?(,?\s*"([^"]*)")?/g

	let words = [];
	let match;
	let word;
	while (match = reg.exec(inputStr)) {
		word = {};
		// word
		if (match[2]) { // the word was quoted with '<word>'
			word.word = match[2];
		} else {
			word.word = match[1];
		}
		// description present
		if (match[4]) {
			word.description = match[4];
		}
		// example present
		if (match[6]) {
			word.example = match[6];
		}
		words.push(word);	
	}
	return words;
}

// update context menu entry when selection contains more words
function checkSelection(selection) {
  const words = parseVoclist(selection);
  if (words.length > 1) {
    chrome.contextMenus.update('addtoParent', {title: `voc.com: add ${words.length} words to...`});
  } else {
    // reset
    chrome.contextMenus.update('addtoParent', {title: addToText});
  }
}

// returns an onlick function for the Add To... context menu
function addToF(wordListId) {
  return (info, tab) => {
    let words = parseVoclist(info.selectionText.toLowerCase());
    vocapi.addToList(words, wordListId)
    .then( () => {
      // send notification
      const notificationId = `add-${words[0].word}-to-${wordListId}`;
      if (words.length > 1) {
        createNotification(notificationId,
          `'${words.length}' words added succesfully`,
          `'${words.length}' words were added to ${vocapi.getListNameSync(wordListId)}.\nClick to open in voc.com.`,
          () => {
            chrome.tabs.create({url: `https://www.vocabulary.com/lists/${wordListId}`});
          });
      } else {
        createNotification(notificationId,
          `'${wordToSave}' added successfully`,
          `'${wordToSave}' was added to ${vocapi.getListNameSync(wordListId)}.\nClick to open in voc.com.`,
          () => {
            chrome.tabs.create({url: `https://www.vocabulary.com/dictionary/${wordToSave}`});
          }); 
        }
    })
    .catch(logError);
  }
}

// only used for start learning multiple words...
function addAll(selectionText, addFunction) {
  const words = parseVoclist(selectionText);
  if (words.length > 1) {
      words.forEach(addFunction);
  } else if (words.length === 1) {
      addFunction(words[0]);
  } else {
      console.warn('voc-adder: no text selected');
  }
}

// the onclick function for start learning
function startLearning(info, tab) {
    addAll(info.selectionText.toLowerCase(), startLearningWord);
}

function startLearningWord(wordToLearn) {
   vocapi.startLearning(wordToLearn.word)
   .then(() => {
    createNotification(`err-${wordToLearn}`,
    `Started learning '${wordToLearn}' successfully'`,
    `Click to open in voc.com.`,
    () => {
      chrome.tabs.create({url: `https://www.vocabulary.com/dictionary/${wordToLearn}`});
    });  
   })
   .catch(logError);
}

function addToNewHandler(info, tab) {

  // set up outgoing port
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    outPort = chrome.tabs.connect(tabs[0].id, {name: "vocadder-back"});

    // becomes invalid after response
    outPort.onMessage.addListener(function(msg) {
      if (msg.type === 'addtoNew') {
        const words = parseVoclist(info.selectionText);
        const listName = msg.name;
        vocapi.addToNewList(words, listName, '', false)
        .then((response) => {
          // send notification
          let listId = response.result;
          const notificationId = `add-words-to-${listId}`;
          createNotification(notificationId,
            `'${listName}' was created successfully`,
            // TODO might not be correct if not all words were legal
            `'${words.length}' words were added to ${listName}.\nClick to open in voc.com.`,
            () => {
              chrome.tabs.create({url: `https://www.vocabulary.com/lists/${listId}`});
            });
        })
        .catch(logError);
      }
    });
    outPort.postMessage({type: 'addtoNew'});
  });
}

// create a notification with the given title, message and onClick function
function createNotification(notificationId, title, message, onClick) {
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "voc_favicon.png",
    title: title,
    message: message
  });
  addNotificationClickListener(notificationId, onClick);
}

// adds a listener that will execute the given action when the notification is clicked
// makes sure the listener is removed when the notification is closed
function addNotificationClickListener(notificationId, action) {
  
  const clickListener = (clickedId) => {
    if (clickedId === notificationId) {
      action();
    }
  };

  // TODO: is onClose also triggered after a click?
  const closeListener = (closedId) => {
    if (closedId === notificationId) {
      // remove click listener
      chrome.notications.onClicked.removeListener(clickListener);
      // remove itself (closeListener)
      chrome.notifications.onClosed.removeListener(closeListener);
    }
  };

  chrome.notifications.onClicked.addListener(clickListener);
  chrome.notifications.onClosed.addListener(closeListener);
}
