//import Db from './settings';
import translate from './api/translate.js'
import VocAPI from '../node_modules/voc-api';
//const db = new Db();

// set up VocAPI
const vocapi = new VocAPI();
let loggedIn = false;

let contextMenus =  {}

// method to create context menu and keep track of its existence
function createContextMenu() {
  if (arguments[0] && arguments[0].id) {
    // TODO: not sure if this will work properly, is creation synchronous or asynchrounous?
    // take in to account calll back and the runtime error?
    chrome.contextMenus[arguments[0].id] = chrome.contextMenus.create.apply(null, arguments);
  }
}

function updateContextMenu() {
  if (arguments[0] && contextMenuExists(arguments[0])) {
    chrome.contextMenus.update.apply(mull, arguments);
  }

}

function removeContextMenu() {
  if (arguments[0] && contextMenuExists(arguments[0])) {
    chrome.contextMenus.remove.apply(null, arguments);
    contextMenus[arguments[0]] = undefined;
  }
}

function contextMenuExists(id) {
  return !!contextMenus[id];
}

function logError(err) {
  console.log("API Error: " + err);
}

function checkLogin() {
  if (loggedIn && contextMenuExists("addtoParent")) {
    return true
  } else {
    vocapi.checkLogin()
    .then(() => {
      removeContextMenu("login");
      loggedIn = true;
      createContextMenus();
    })
    .catch((err) => {
        // create a context menu to redirect to a login page
        contextMenus.login = createContextMenu({id: "login", title: "Log in to voc.com to save words", onclick: () => {
          chrome.tabs.create({url: 'https://www.vocabulary.com/login'});
        }}, () => {
          console.log(chrome.runtime.lastError);
        });
        logError(err);
    });
  }
}

// incoming connection
chrome.runtime.onMessage.addListener(
  (msg, sender, sendResponse) => {
    let type = msg.type;
    let selection = msg.selection;
    if (type === 'checkLogin') {
      checkLogin();
    } else if (type === 'selection') {
      checkSelection(selection);
    } else if (type === 'translation') {
      translate.apply(null, msg.args).then(sendResponse).catch(err => {
          console.error(err);
      });
      return true;
    }
  });

function sendToActiveTab(message, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, callback);
  });
} 

checkLogin();


const addToText = "voc.com: add '%s' to...";

// create "add to" context menus
function createContextMenus() {

  vocapi.getLists()
  .then((lists) => {
    contextMenus.addtoParent = createContextMenu({id: "addtoParent", title: addToText, contexts: ["selection"]});
    // create "start learning" context menu
    createContextMenu({id: "learnvoc", parentId: "addtoParent", title:"Just Start Learning", contexts: ["selection"], 
    onclick: startLearning});
    // separator
    createContextMenu({id: "sep", parentId: "addtoParent", type: "separator", contexts: ["selection"]});
    // add list entries
    lists.forEach((wordList) => {
      createContextMenu({id: `addto-${wordList.name}`, 
      title: `${wordList.name} (${wordList.wordcount})`, parentId: "addtoParent", contexts: ["selection"], onclick: addToF(wordList.wordlistid)})
    });
    // separator 2
    createContextMenu({id: "sep2", parentId: "addtoParent", type: "separator", contexts: ["selection"]});
    // add to new list entry
    createContextMenu({id: "addtoNew", parentId: "addtoParent", title: "Add to a new list...", contexts: ["selection"], onclick: addToNewHandler});
  })
  .catch(logError);
}

/**
 * 
 * @param {*} inputStr 
 * @param {*} synchronous optional: if synchronous, it will not gather a surrounding sentence for a single word
 */
function parseVoclist(inputStr, synchronous) {
    /* 
    * start of string
    * greedy whitespace
    * word char or - TODO: also ' as in Bailey's or something
    * greedy whitespace
    * optional extension (= description and/or example):
    *  ':' : start of extension
    *  description: everything except , (one line mode) or newlines
    *  also optional: example, signaled by a quote
    */
    let reg = /\s*([\w-]+|'([^']+)')\s*(\:\s*([^,\r\n]*))?(,?\s*"([^"]*)")?/g
    
    let words = [];
    let match;
    let word;
    while (match = reg.exec(inputStr)) {
      word = {};
      // word
      if (match[2]) { // the word was quoted with '<word>'
        word.word = match[2];
      } else {
        word.word = match[1].toLowerCase();
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
      
    if (!synchronous) {
      return new Promise((resolve, reject) => {
        if (words.length === 1) {
          sendToActiveTab({type: 'sentence'}, (sentenceObj) => {
            if (sentenceObj) {
              words[0].sentence = sentenceObj.sentence;
              words[0].location = sentenceObj.location;
              words[0].title = sentenceObj.title;
            }
            resolve(words);
          });
        } else {
          resolve(words);
        }
      });
    } else {
      return words;
    }
}

// update context menu entry when selection contains more words
function checkSelection(selection) {
  if (loggedIn && contextMenuExists('addtoParent')) {
    // TODO: problems if you logged out after logging in, in same browser session
    const words = parseVoclist(selection, true);
    if (words.length > 1) {
      updateContextMenu('addtoParent', {title: `voc.com: add ${words.length} words to...`});
    } else {
      // reset
      updateContextMenu('addtoParent', {title: addToText});
    }
  }
}

// returns an onlick function for the Add To... context menu
function addToF(wordListId) {
  return (info, tab) => {
    parseVoclist(info.selectionText).then((words) => {
      vocapi.addToList(words, wordListId)
      .then( (result) => {
        // send notification
        const firstWord = result.corrected ? result.corrected : result.original;
        const notificationId = `add-${firstWord}-to-${wordListId}`;
        if (words.length > 1) {
          createNotification(notificationId,
            `${words.length} words added`,
            `${words.length} words were added to ${vocapi.getListNameSync(wordListId)}.\nClick to open in voc.com.`,
            () => {
              chrome.tabs.create({url: `https://www.vocabulary.com/lists/${wordListId}`});
            });
        } else {
          createNotification(notificationId,
            `'${firstWord}' added`,
            `'${firstWord}' was added to ${vocapi.getListNameSync(wordListId)}.\nClick to open in voc.com.`,
            () => {
              chrome.tabs.create({url: `https://www.vocabulary.com/dictionary/${firstWord}`});
            }); 
          }
      })
      .catch(logError);
    });
  }
}

// only used for start learning multiple words...
function addAll(selectionText, addFunction) {
  const words = parseVoclist(selectionText, true);
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
  sendToActiveTab({type: 'addtoNew'}, msg => {
    if (msg.type === 'addtoNew') {
      parseVoclist(info.selectionText).then((words) => {
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
      });
    }
  });
}

// create a notification with the given title, message and onClick function
function createNotification(notificationId, title, message, onClick) {
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "icons/favicon-114x114.png",
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
