/** 
 * Promise based API interfacefor Vocabulary.com
 * */
class VocAPI {

    constructor() {
        this.PROTOCOL = 'https';
        this.HOST = 'www.vocabulary.com';
        this.URLBASE = `${this.PROTOCOL}://${this.HOST}`;
        this.listNameCache = {};

        this.loggedIn = false;
    }
    
    /**
     * log-in check
     */
    checkLogin() {
        if (!this.loggedIn) {
            const requestUrl = `${this.URLBASE}/account/progress`;
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

    getListName(id) {
        if (id in this.listNameCache) {
            return Promise.resolve(this.listNameCache[id]);
        } else {
            return Promise.reject('Name not found in cache');
        }
    }

    getListNameSync(id) {
        if (id in this.listNameCache) {
            return this.listNameCache[id];
        } 
    }

    /**
     * 
     */
    getLists() {
        return new Promise( (resolve, reject) => {
            const refererUrl = `${this.URLBASE}/dictionary/hacker`; 
            const requestUrl = `${this.URLBASE}/lists/byprofile.json`;

            // options: name, createdate, wordcount, activitydate TODO: make options
            let sortBy = "modifieddate"

            VocAPI.withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
                var req = new XMLHttpRequest();
                req.open("GET", requestUrl, true);
                req.withCredentials = true;
                req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                req.responseType = "json";
                // TODO: this versus onload?
                req.onreadystatechange = () => {
                    if (req.readyState == 4 && req.status == 200) {
                        detachHook();
                        
                        const lists = req.response.result.wordlists
                            .filter(wl => wl.owner)
                            .sort((a,b) => a[sortBy] > b[sortBy] ? -1 : 1); // high to low
                        
                        // fill cache with names
                        lists.forEach(wl => {
                            this.listNameCache[wl.wordlistid] = wl.name;
                        })
                        resolve(lists);
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
     * @param wordToLearn as a plain word
     */
    startLearning(wordToLearn) {
        return new Promise((resolve, reject) => {
            console.log("Trying to learn " + wordToLearn)
            const refererUrl = `${this.URLBASE}/dictionary/${wordToLearn}`; 
            const requestUrl = `${this.URLBASE}/progress/startlearning.json`;
        
            VocAPI.withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
              var req = new XMLHttpRequest();
              req.open("POST", requestUrl, true);
              req.withCredentials = true;
              req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
              req.onreadystatechange = function () {
                if (req.readyState == 4 && req.status == 200) {
                    detachHook();
                    resolve(req.responseText);
                }
                else if (req.status != 200) {
                    reject();
                    console.log(`Error: ` + req.responseText);
                }
              }
              req.send(`word=${wordToLearn}`);
            });
        });
    }

    /**
     * Maps words from this interface's format to voc.com's format
     * Adds some obvious info
     * @param {} w 
     */
    static wordMapper(w) {
        let nw = {
        "word": w.word,
        "lang": "en"
        }
        w.description ? nw["description"] = w.description : false;
        w.example ? nw["example"] = { "text": w.example } : false;
        return nw;
    }

    /** 
    * @param words an array of words to add to the list - format:
    * [
        {
            "word":"kangaroo",
            "description":"Test kangaroo", 
            "example": "Kangaroo makes me boo"
        }
        ]
        description and example are optional
    * @param listId id of the listlist
    */ 
    addToList(words, listId) {
        return new Promise((resolve, reject) => {
            console.log("Trying to save " + words)
            const refererUrl = `${this.URLBASE}/dictionary/${words[0]}`; 
            const requestUrl = `${this.URLBASE}/lists/save.json`;
          
            VocAPI.withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
              var req = new XMLHttpRequest();
              req.open("POST", requestUrl, true);
              req.withCredentials = true;
              req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
              let wordObjects = words.map(VocAPI.wordMapper);

              req.onload = function () {
                if (req.status == 200) {
                    console.log(req.responseText);
                    detachHook();
                    resolve(req.responseText);
                }
                else if (req.status != 200) {
                    reject(req.responseText);        
                    console.log(`Error: ` + req.responseText);
                }
               }
              const toSend = {
                  "addwords": JSON.stringify(wordObjects),
                  "id": listId 
              }
              req.send(VocAPI.getFormData(toSend));
            });
        });
    }

    /** 
    * @param words an array of words to add to the new list
    * @param listName name of the new list
    * @param description description of the list
    * @param shared boolean that shows whether list should be shared or not
    */ 
    addToNewList(words, listName, description, shared) {
        return Promise((resolve, reject) => {
            const refererUrl = `${this.URLBASE}/lists/vocabgrabber`; 
            const requestUrl = `${this.URLBASE}lists/save.json`;
          
            let listObj = {
              //"words": words.map((w) => { return {"word": w} }),
              "words": words.map(VocAPI.wordMapper),
              "name": listName,
              "description": description,
              "action": "create",
              "shared": shared
            }
          
            VocAPI.withModifiedReferrer(refererUrl, requestUrl, (detachHook) => {
              var req = new XMLHttpRequest();
              req.open("POST", requestUrl, true);
              req.responseType = "json";
              req.withCredentials = true;
              req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
          
              req.onload = function () {
                if (req.status == 200) {
                    console.log(req.response);
                    resolve(req.response);                    
                    detachHook();
                } else if (req.status != 200) {
                  console.log(`Error: ` + req.response);
                  reject(req.response);
                }
               }
              req.send(VocAPI.getFormData({'wordlist': JSON.stringify(listObj)}));
            });
        });
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

    /**
     * Transforms objects of the form {"key": value, "key2": value2} to the form key=value&key2=value2
     * With the values interpreted as strings. They are URL encoded in the process.
     * @param {*} object 
     */
    static getFormData(object) {
        // const formData = new FormData();
        // Object.keys(object).forEach(key => formData.append(key, object[key]));
        let returnString = '';
        Object.keys(object).forEach((key, index) => returnString += `${index === 0 ? '' : '&'}${key}=${encodeURIComponent(object[key])}`)
        return returnString;
        }

}