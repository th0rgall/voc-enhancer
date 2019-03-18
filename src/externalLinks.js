const makeLinkGetter = (f) => ((w) => f(encodeURIComponent(w)));

export default externalLinks = {
        "duckduckgo_images": {
            "title": 'DuckDuckGo Image Search',
            "icon": 'icons/ddg-favicon.ico',
            "getLink": makeLinkGetter((w) => `https://duckduckgo.com/?q=${w}&t=ffab&iax=images&ia=images`)
        }, 
        "google_images": {
            "title": 'Google Image Search',
            "icon": 'icons/google-favicon.ico',
            "getLink": makeLinkGetter((w) => `https://www.google.com/search?tbm=isch&q=${w}&tbs=imgo:1`)
        },
        "giphy_images": {
            "title": 'GIPHY Image Search',
            "icon": 'icons/giphy-favicon.png',
            "getLink": makeLinkGetter((w) => `https://giphy.com/search/${w}`)
        },
        "youglish": {
            "title": 'YouGlish Pronounciation Search',
            "icon": 'icons/youglish-favicon.png',
            "getLink": makeLinkGetter((w) => `https://youglish.com/search/${w}`)
        }, 
        "urban_dictionary": {
            "title": 'Urban Dictionary Search',
            "icon": 'icons/urbandictionary-favicon.ico',
            "getLink": makeLinkGetter((w) => `https://www.urbandictionary.com/define.php?term=${w}`)
        },
        "dictionary_com": {
            "title": 'Dictionary.com Search',
            "icon": 'icons/dictionary-com.png',
            "getLink": makeLinkGetter((w) => `https://www.dictionary.com/browse/${w}`)
        },
        "thesaurus_com": {
            "title": 'Thesaurus.com Search',
            "icon": 'icons/thesaurus-com.png',
            "getLink": makeLinkGetter((w) => `https://www.thesaurus.com/browse/${w}`)
        }, 
        "wiktionary": {
            "title": 'Wiktionary',
            "icon": 'icons/wiktionary.ico',
            "getLink": makeLinkGetter((w) => `https://en.wiktionary.org/wiki/${w}`)
        },
        "wikipedia": {
            "title": 'Wikipedia',
            "icon": 'icons/wikipedia.ico',
            "getLink": makeLinkGetter((w) => `https://en.wikipedia.org/wiki/${w}`)
        },
        "wordnik": {
            "title": 'Wordnik',
            "icon": 'icons/wordnik.png',
            "getLink": makeLinkGetter((w) => `https://www.wordnik.com/words/${w}`)
        },
        "merriam_webster": {
            "title": 'Merriam-Webster',
            "icon": 'icons/merriam-webster.png',
            "getLink": makeLinkGetter((w) => `https://www.merriam-webster.com/dictionary/${w}`)
        },
        "google_define": {
            "title": 'Google Define',
            "icon": 'icons/google-define.png',
            "getLink": makeLinkGetter((w) => `https://www.google.com/search?hl=en&q=google%20define#dobs=${w}`)
        }, 
        "free_dictionary": {
            "title": 'The Free Dictionary',
            "icon": 'icons/thefreedictionary.png',
            "getLink": makeLinkGetter((w) => `https://www.thefreedictionary.com/${w}`)
        }
    };