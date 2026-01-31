function insertTextIntoElement(element, text) {
  if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    const before = element.value.slice(0, start);
    const after = element.value.slice(end);
    element.value = `${before}${text}${after}`;
    element.selectionStart = element.selectionEnd = start + text.length;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  if (element.isContentEditable) {
    element.focus();
    document.execCommand("insertText", false, text);
    return true;
  }

  return false;
}

function isEditableElement(element) {
  if (!element) {
    return false;
  }
  if (element.tagName === "TEXTAREA") {
    return true;
  }
  if (element.tagName === "INPUT") {
    const allowed = ["text", "search", "url", "email"];
    return allowed.includes(element.type);
  }
  return element.isContentEditable;
}

function findTargetElement() {
  const active = document.activeElement;
  if (isEditableElement(active)) {
    return active;
  }

  return document.querySelector(
    "textarea, input[type='text'], input[type='search'], input[type='url'], input[type='email'], [contenteditable='true']"
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "INSERT_PROMPT") {
    return;
  }

  const text = message.payload ?? "";
  const target = findTargetElement();
  let success = false;

  if (target) {
    success = insertTextIntoElement(target, text);
  }

  sendResponse({ success });
});
