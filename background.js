
chrome.contextMenus.create({id: "vocbase", title:"Learn '%s' on voc.com", contexts: ["selection"], "onclick": startLearning});

function startLearning(info, tab) {
    var selection = info.selectionText;

    console.log("Trying to save " + selection)

    let wordToSave = selection.toLowerCase();

    // request to dictionary to set referrer
    var req = new XMLHttpRequest();
    req.open("GET", `https://www.vocabulary.com/dictionary/${wordToSave}`);
    req.send();

    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders

    function refererListener(details) {
      const refererUrl = `https://www.vocabulary.com/dictionary/${wordToSave}`; 
      const i = details.requestHeaders.findIndex(e => e.name.toLowerCase() == "referer");
      if (i != -1) {
        details.requestHeaders[i].value = refererUrl;
      } else {
        details.requestHeaders.push({name: "Referer", value: refererUrl});
      }
      return Promise.resolve(details);
    }
    
    browser.webRequest.onBeforeSendHeaders.addListener(
      refererListener, //  function
      {urls: ["https://www.vocabulary.com/progress/startlearning.json"]}, //  RequestFilter object
      ["requestHeaders", "blocking"] //  extraInfoSpec
    );

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
    }

    req.send(`word=${selection.toLowerCase()}`);
    };

    if (browser.webRequest.onBeforeSendHeaders.hasListener(refererListener)) {
      browser.webRequest.onBeforeSendHeaders.removeListener(refererListener)
    }

var lastSentence = "";


// getSentence listener (separate from context menu)
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendRequest(tab.id, {method: "getSentence"}, function(response){
     lastSentence = response.sentence;
  });
});


// https://developer.chrome.com/extensions/contextMenus#method-create TODO: event page ervan maken?
