
/* Promise based API interfacefor Vocabulary.com*/
class VocAPI {

    constructor() {
        this.PROTOCOL = 'https';
        this.HOST = 'www.vocabulary.com';
        this.URLBASE = `${this.PROTOCOL}://${this.HOST}`;

        this.loggedIn = false;
        checkLogin();
    }

// implement on checklogin reject
// // create a context menu to redirect to a login page
// chrome.contextMenus.create({id: "login", title: "Log in to voc.com to save words", onclick: () => {
//     chrome.tabs.create({url: 'https://www.vocabulary.com/login'});
// }});

// imlement on checklogin resolve
// chrome.contextMenus.remove("login");
// createContextMenus();

    /**
     * log-in check
     */
    checkLogin() {
        if (!this.loggedIn) {
            requestUrl = `${this.URLBASE}/account/progress`;
            var req = new XMLHttpRequest();
            req.open("GET", requestUrl, true);
            //req.withCredentials = true;
            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            req.responseType = "json";
            
            return new Promise((resolve, reject) => {
                req.onload = function () {
                    if (req.responseURL !== requestUrl) { // response url was not same as requested url: 302 login redirect happened
                        reject('not logged in');
                    } else {
                        loggedIn = true;
                        resolve('already logged in');
                    }
                }
                req.send();
            })
        } else {
            return Promise.resolve('already logged in');
        }
    }

// implement in create context menus
//     chrome.contextMenus.create({id: "addtoParent", title: addToText, contexts: ["selection"]});
//     // create "start learning" context menu
//     chrome.contextMenus.create({id: "learnvoc", parentId: "addtoParent", title:"Just Start Learning", contexts: ["selection"], 
//     onclick: startLearning});
//     // separator
//     chrome.contextMenus.create({id: "sep", parentId: "addtoParent", type: "separator", contexts: ["selection"]});
//     // add list entries
//     RESPONSEVALUE.result.wordlists
//       .filter(wl => wl.owner)
//       .sort((a,b) => a[sortBy] > b[sortBy] ? -1 : 1) // high to low
//       .forEach((wordList) => {
//       chrome.contextMenus.create({id: `addto-${wordList.name}`, 
//       title: `${wordList.name} (${wordList.wordcount})`, parentId: "addtoParent", contexts: ["selection"], onclick: addTo(wordList.wordlistid)})
//     });
//     // separator 2
//     chrome.contextMenus.create({id: "sep2", parentId: "addtoParent", type: "separator", contexts: ["selection"]});
//     // add to new list entry
//     chrome.contextMenus.create({id: "addtoNew", parentId: "addtoParent", title: "Add to a new list...", contexts: ["selection"], onclick: addToNewHandler
//   })

    /**
     * 
     */
    getLists() {
        return new Promise( (resolve, reject) => {
            const refererUrl = `${this.URLBASE}/dictionary/hacker`; 
            const requestUrl = `${this.URLBASE}/lists/byprofile.json`;
          
            // options: name, createdate, wordcount, activitydate TODO: make options
            let sortBy = "modifieddate"

            withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
                var req = new XMLHttpRequest();
                req.open("GET", requestUrl, true);
                req.withCredentials = true;
                req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                req.responseType = "json";
                // TODO: this versus onload?
                req.onreadystatechange = function () {
                  if (req.readyState == 4 && req.status == 200) {
                    resolve(req.response);
                    detachHook();
                  }
                  else if (req.status != 200) {
                    console.log(`Error: ` + req.responseText);
                    reject();
                  }
                }
                req.send();
              }); 
        }
        );
    }

/**
 * Execute an function with a modified Referer header for browser requests
 * @param {*} refererUrl the referer URL that will be injected
 * @param {*} requestUrl the request URL's for which the header has to be injected
 * @param {*} action the action (request) to be executed. 
 *                  Gets passed a function that will detach the header modifier hook if called
 */
static withModifiedReferrer(refererUrl, requestUrl, action) {
    function refererListener(details) {
      const i = details.requestHeaders.findIndex(e => e.name.toLowerCase() == "referer");
      if (i != -1) {
        details.requestHeaders[i].value = refererUrl;
      } else {
        details.requestHeaders.push({name: "Referer", value: refererUrl});
      }
      // Firefox uses promises
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
  
    // TODO:    why not hook detach after action? async?
    //          hook should be detached after the request was sent, automatically   
    action(() => {
      // detach hook
      if (chrome.webRequest.onBeforeSendHeaders.hasListener(refererListener)) {
        chrome.webRequest.onBeforeSendHeaders.removeListener(refererListener)
      }
    });
  }

}