// create "start learning" context
chrome.contextMenus.create({id: "learnvoc", title:"Learn '%s' on voc.com", contexts: ["selection"], 
  "onclick": startLearning});

// create "add to" context
function createAddToContext() {
  let refererUrl = `https://www.vocabulary.com/dictionary/hacker`; 
  withModifiedReferrer(refererUrl, (detachHook) => {
    var req = new XMLHttpRequest();
    req.open("GET", "https://www.vocabulary.com/lists/byprofile.json", true);
    req.withCredentials = true;
    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    req.responseType = "json";
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
        chrome.contextMenus.create({id: "addtoParent", title: "Add '%s' to..."});
        req.response.result.wordlists.forEach((wordList) => {
          chrome.contextMenus.create({id: `addto-${wordList.name}`, 
          title: wordList.name, parentId: "addtoParent", onclick: addTo(wordList.wordlistid)})
        }
        );
      }
      else if (req.status != 200) {
        console.log(`Error: ` + req.responseText);
      }
      detachHook();
    }
    req.send();
  }); 
  
}

createAddToContext();

/**
 * Execute an function with a modified Referer header for browser requests
 * @param {*} refererUrl 
 * @param {*} action the action (request) to be executed. 
 *                  Gets passed a function that will detach the header modifier hook if called
 */
function withModifiedReferrer(refererUrl, action) {
  function refererListener(details) {
    const i = details.requestHeaders.findIndex(e => e.name.toLowerCase() == "referer");
    if (i != -1) {
      details.requestHeaders[i].value = refererUrl;
    } else {
      details.requestHeaders.push({name: "Referer", value: refererUrl});
    }
    return Promise.resolve(details);
  }

  // modify headers with webRequest hook
  browser.webRequest.onBeforeSendHeaders.addListener(
    refererListener, //  function
    {urls: [
      "https://www.vocabulary.com/progress/startlearning.json",     //  RequestFilter object
      "https://www.vocabulary.com/lists/byprofile.json", 
      "https://www.vocabulary.com/lists/save.json"]}, 
    ["requestHeaders", "blocking"] //  extraInfoSpec
  );

  action(() => {
    // detach hook
    if (browser.webRequest.onBeforeSendHeaders.hasListener(refererListener)) {
      browser.webRequest.onBeforeSendHeaders.removeListener(refererListener)
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

    withModifiedReferrer(refererUrl, (detachHook) => {
      var req = new XMLHttpRequest();
      req.open("POST", "https://www.vocabulary.com/progress/startlearning.json", true);
      req.withCredentials = true;
      req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
      req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            console.log(req.responseText);
        }
        else if (req.status != 200) {
          console.log(`Error: ` + req.responseText);
        }
        detachHook();
      }
      req.send(`word=${wordToLearn}`);
    });
}

function addToList(listId, wordToSave) {
  console.log("Trying to save " + wordToSave)
  let refererUrl = `https://www.vocabulary.com/dictionary/${wordToSave}`; 

  withModifiedReferrer(refererUrl, (detachHook) => {
    var req = new XMLHttpRequest();
    req.open("POST", "https://www.vocabulary.com/lists/save.json", true);
    req.withCredentials = true;
    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    let saveObj = {
      "word": wordToSave,
      "lang": "en"
    }
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
          console.log(req.responseText);
      }
      else if (req.status != 200) {
        console.log(`Error: ` + req.responseText);
      }
      detachHook();
    }
    const toSend = `addwords=${encodeURIComponent(JSON.stringify([saveObj]))}&id=${listId}`;
    req.send(toSend);
  });
}