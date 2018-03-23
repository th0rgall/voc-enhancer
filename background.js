

// create "add to" context menus
function createContextMenus() {
  const refererUrl = `https://www.vocabulary.com/dictionary/hacker`; 
  const requestUrl = "https://www.vocabulary.com/lists/byprofile.json";

  // options: name, createdate, wordcount, activitydate TODO: make options
  let sortBy = "modifieddate"

  withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
    var req = new XMLHttpRequest();
    req.open("GET", requestUrl, true);
    req.withCredentials = true;
    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    req.responseType = "json";
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
        chrome.contextMenus.create({id: "addtoParent", title: "voc.com: add '%s' to...", contexts: ["selection"]});
        // create "start learning" context menu
        chrome.contextMenus.create({id: "learnvoc", parentId: "addtoParent", title:"Just Start Learning", contexts: ["selection"], 
        "onclick": startLearning});
        // separator
        chrome.contextMenus.create({id: "sep", parentId: "addtoParent", type: "separator", contexts: ["selection"]});
        // add list entries
        req.response.result.wordlists
          .filter(wl => wl.owner)
          .sort((a,b) => a[sortBy] > b[sortBy] ? -1 : 1) // high to low
          .forEach((wordList) => {
          chrome.contextMenus.create({id: `addto-${wordList.name}`, 
          title: `${wordList.name} (${wordList.wordcount})`, parentId: "addtoParent", contexts: ["selection"], onclick: addTo(wordList.wordlistid)})
        });
        detachHook();
      }
      else if (req.status != 200) {
        console.log(`Error: ` + req.responseText);
      }
    }
    req.send();
  }); 
  
}

createContextMenus();

/**
 * Execute an function with a modified Referer header for browser requests
 * @param {*} refererUrl the referer URL that will be injected
 * @param {*} requestUrl the request URL's for which the header has to be injected
 * @param {*} action the action (request) to be executed. 
 *                  Gets passed a function that will detach the header modifier hook if called
 */
function withModifiedReferrer(refererUrl, requestUrl, action) {
  function refererListener(details) {
    const i = details.requestHeaders.findIndex(e => e.name.toLowerCase() == "referer");
    if (i != -1) {
      details.requestHeaders[i].value = refererUrl;
    } else {
      details.requestHeaders.push({name: "Referer", value: refererUrl});
    }
    // Firefox uses promis
    // return Promise.resolve(details);
    // Chrome doesn't. Todo: https://github.com/mozilla/webextension-polyfill

    // important: do create a new object, passing the modified argument does not work
    return {requestHeaders: details.requestHeaders};
  }

  // modify headers with webRequest hook
  chrome.webRequest.onBeforeSendHeaders.addListener(
    refererListener, //  function
    {urls: [requestUrl]}, // RequestFilter object
    ["requestHeaders", "blocking"] //  extraInfoSpec
  );

  action(() => {
    // detach hook
    if (chrome.webRequest.onBeforeSendHeaders.hasListener(refererListener)) {
      chrome.webRequest.onBeforeSendHeaders.removeListener(refererListener)
    }
  });
}

// returns an onlick function for the Add To... context menu
function addTo(wordListId) {
  return (info, tab) => {
    addToList(wordListId, info.selectionText.toLowerCase());
  }
}

// the onclick function for start learning
function startLearning(info, tab) {;
  startLearningWord(info.selectionText.toLowerCase());
}

function startLearningWord(wordToLearn) {
    console.log("Trying to learn " + wordToLearn)
    let refererUrl = `https://www.vocabulary.com/dictionary/${wordToLearn}`; 
    let requestUrl = "https://www.vocabulary.com/progress/startlearning.json";

    withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
      var req = new XMLHttpRequest();
      req.open("POST", requestUrl, true);
      req.withCredentials = true;
      req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
      req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            console.log(req.responseText);
            detachHook();
        }
        else if (req.status != 200) {
          console.log(`Error: ` + req.responseText);
        }
      }
      req.send(`word=${wordToLearn}`);
    });
}

function addToList(listId, wordToSave) {
  console.log("Trying to save " + wordToSave)
  const refererUrl = `https://www.vocabulary.com/dictionary/${wordToSave}`; 
  const requestUrl = "https://www.vocabulary.com/lists/save.json";

  withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
    var req = new XMLHttpRequest();
    req.open("POST", requestUrl, true);
    req.withCredentials = true;
    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    let saveObj = {
      "word": wordToSave,
      "lang": "en"
    }
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
          console.log(req.responseText);
          detachHook();
      }
      else if (req.status != 200) {
        console.log(`Error: ` + req.responseText);
      }
     }
    const toSend = `addwords=${encodeURIComponent(JSON.stringify([saveObj]))}&id=${listId}`;
    req.send(toSend);
  });
}