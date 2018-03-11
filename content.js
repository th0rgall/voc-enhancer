//// MESSAGE passing: todo

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.method == "getSentence")
      sendResponse({sentence: getSelectedSentence()});
    else
      sendResponse({});
});

//////////////////

String.prototype.contains = function (s) {
    return this.indexOf(s) >= 0;
}

function getSelectedSentence() {
  var pt = getSelectedParagraphText().trim();
  var sen = pt
   .match( /[^\.!\?]+[\.!\?]+/g )
   .find(function(candidate) {
     return candidate.contains(getSelectedTextNode().toString());
   }).trim();
  return sen ? sen : pt; // return whole paragraphtext if sentence match did not work
}

// todo: make smarter, only works for <p> & <li>'s now'

function getSelectedParagraphText() {
  var selection = getSelectedTextNode();

  // traverse DOM upwards until we find a wrapping <p> tag
  var parent = selection.anchorNode;
  while (parent != null && !validNodeName(parent.nodeName)) {
    parent = parent.parentNode;
  }

  if (parent == null) {
    return "";
  } else {
    return parent.innerText || parent.textContent;
  }
}

function validNodeName(nn) {
  switch (nn.toLowerCase()) {
    case "p":
      return true;
      break;
    case "li":
      return true;
      break;
    default:
      return false;
  }
}

function getSelectedTextNode() {
  if (window.getSelection) {
      return window.getSelection();
  } else if (document.selection) {
      return document.selection.createRange();
  }
  return "";
}
