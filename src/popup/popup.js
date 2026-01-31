import { loadState, saveState } from "../shared/storage.js";
import {
  composeTemplateSections,
  isValidTemplateSchema,
  renderTemplate,
  splitTemplateSections,
  extractOverviewTokens
} from "../shared/templating.js";

const templateList = document.getElementById("templateList");
const overviewPreview = document.getElementById("overviewPreview");
const overviewInputs = document.getElementById("overviewInputs");
const renderedOutput = document.getElementById("renderedOutput");
const promptSections = document.getElementById("promptSections");
const templateDescription = document.getElementById("templateDescription");
const exportTemplateOutput = document.getElementById("exportTemplateOutput");
const exportCopyButton = document.getElementById("exportCopyButton");
const importTemplateInput = document.getElementById("importTemplateInput");
const importTemplateButton = document.getElementById("importTemplateButton");
const importStatus = document.getElementById("importStatus");
const copyButton = document.getElementById("copyButton");
const insertButton = document.getElementById("insertButton");
const newTemplateButton = document.getElementById("newTemplateButton");
const statusMessage = document.getElementById("statusMessage");

let state = null;
let currentTemplateId = null;
let variableValues = {};
let blockValues = {};

const SHARE_PREFIX = "prompttemplate://";

function setStatus(message) {
  statusMessage.textContent = message;
}

function setImportStatus(message) {
  importStatus.textContent = message;
}

function getTemplateById(id) {
  return state.templates.find((template) => template.id === id);
}

function generateTemplateId() {
  const base = "template";
  const existing = new Set(state.templates.map((template) => template.id));
  let index = state.templates.length + 1;
  while (existing.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

function buildTemplateList() {
  templateList.innerHTML = "";
  state.templates.forEach((template) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "template-list__item";
    if (template.id === currentTemplateId) {
      button.classList.add("is-active");
    }
    button.textContent = template.name || template.id;
    button.addEventListener("click", () => {
      applyTemplateSelection(template);
    });
    templateList.append(button);
  });
}

function renderOverview(template) {
  overviewPreview.innerHTML = "";
  overviewInputs.innerHTML = "";
  variableValues = {};
  blockValues = {};

  if (!template) {
    templateDescription.textContent = "";
    renderedOutput.value = "";
    exportTemplateOutput.value = "";
    return;
  }

  templateDescription.textContent = template.description;

  const sections = splitTemplateSections(template.template);
  const overview = sections[0]?.content ?? "";
  const tokens = extractOverviewTokens(overview);

  const fragment = document.createDocumentFragment();
  tokens.parts.forEach((part) => {
    if (part.type === "text") {
      fragment.append(document.createTextNode(part.value));
      return;
    }
    const chip = document.createElement("span");
    chip.className = part.type === "block" ? "token token--block" : "token";
    chip.textContent = part.label;
    fragment.append(chip);
  });
  overviewPreview.append(fragment);

  tokens.variables.forEach((variable) => {
    variableValues[variable] = "";
    const field = document.createElement("label");
    field.className = "field";
    const label = document.createElement("span");
    label.className = "field__label";
    label.textContent = variable;
    const input = document.createElement("input");
    input.className = "field__input";
    input.type = "text";
    input.addEventListener("input", () => {
      variableValues[variable] = input.value;
      updateRenderedOutput();
    });
    field.append(label, input);
    overviewInputs.append(field);
  });

  tokens.blocks.forEach((block) => {
    blockValues[block] = "";
    const field = document.createElement("label");
    field.className = "field";
    const label = document.createElement("span");
    label.className = "field__label";
    label.textContent = block;
    const textarea = document.createElement("textarea");
    textarea.className = "field__input";
    textarea.rows = 3;
    textarea.addEventListener("input", () => {
      blockValues[block] = textarea.value;
      updateRenderedOutput();
    });
    field.append(label, textarea);
    overviewInputs.append(field);
  });

  exportTemplateOutput.value = encodeShareTemplate(template);
  updateRenderedOutput();
}

function renderPromptSections(template) {
  promptSections.innerHTML = "";
  if (!template) {
    return;
  }

  const sections = splitTemplateSections(template.template);
  sections.forEach((section, index) => {
    const container = document.createElement("div");
    container.className = "field";

    const label = document.createElement("span");
    label.className = "field__label";
    label.textContent = section.title;

    const textarea = document.createElement("textarea");
    textarea.className = "field__input";
    textarea.rows = 5;
    textarea.value = section.content.trim();
    textarea.addEventListener("input", () => {
      sections[index].content = textarea.value;
      template.template = composeTemplateSections(sections);
      renderOverview(template);
      updateRenderedOutput();
      exportTemplateOutput.value = encodeShareTemplate(template);
      saveState(state);
    });

    container.append(label, textarea);
    promptSections.append(container);
  });
}

function applyBlockValues(templateText) {
  return templateText.replace(/\{(?!\{)([^}]+)\}/g, (match, key) => {
    const normalizedKey = key.trim();
    if (Object.prototype.hasOwnProperty.call(blockValues, normalizedKey)) {
      return blockValues[normalizedKey];
    }
    return match;
  });
}

function updateRenderedOutput() {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    renderedOutput.value = "";
    return;
  }
  const withBlocks = applyBlockValues(template.template);
  renderedOutput.value = renderTemplate(withBlocks, variableValues);
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(renderedOutput.value);
    setStatus("Copied to clipboard.");
  } catch (error) {
    setStatus("Unable to copy to clipboard.");
  }
}

async function handleInsert() {
  setStatus("");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("No active tab found.");
    return;
  }
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "INSERT_PROMPT",
      payload: renderedOutput.value
    });
    if (response?.success) {
      setStatus("Inserted into page.");
    } else {
      setStatus("Could not insert into the page.");
    }
  } catch (error) {
    setStatus("Failed to communicate with the page.");
  }
}

function encodeShareTemplate(template) {
  const json = JSON.stringify(template);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return `${SHARE_PREFIX}${base64}`;
}

function decodeShareTemplate(payload) {
  if (!payload.startsWith(SHARE_PREFIX)) {
    return null;
  }
  const raw = payload.slice(SHARE_PREFIX.length);
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

function applyTemplateSelection(template) {
  currentTemplateId = template.id;
  buildTemplateList();
  renderOverview(template);
  renderPromptSections(template);
}

async function init() {
  state = await loadState();
  if (!state.templates.length) {
    state.templates = [];
    await saveState(state);
  }

  buildTemplateList();
  currentTemplateId = state.templates[0]?.id ?? null;

  if (currentTemplateId) {
    const template = getTemplateById(currentTemplateId);
    applyTemplateSelection(template);
  }
}

exportCopyButton.addEventListener("click", async () => {
  if (!exportTemplateOutput.value) {
    setStatus("No layout selected.");
    return;
  }
  try {
    await navigator.clipboard.writeText(exportTemplateOutput.value);
    setStatus("Export copied.");
  } catch (error) {
    setStatus("Unable to copy export.");
  }
});

importTemplateButton.addEventListener("click", () => {
  setImportStatus("");
  const value = importTemplateInput.value.trim();
  if (!value.startsWith(SHARE_PREFIX)) {
    setImportStatus("Invalid import link.");
    return;
  }
  const template = decodeShareTemplate(value);
  if (!template || !isValidTemplateSchema(template)) {
    setImportStatus("Malformed layout data.");
    return;
  }
  const exists = state.templates.some((item) => item.id === template.id);
  const newTemplate = { ...template };
  if (exists) {
    newTemplate.id = generateTemplateId();
  }
  state.templates.push(newTemplate);
  saveState(state);
  applyTemplateSelection(newTemplate);
  importTemplateInput.value = "";
  setImportStatus("Layout imported.");
});

newTemplateButton.addEventListener("click", () => {
  const newTemplate = {
    id: generateTemplateId(),
    name: "New layout",
    description: "",
    template: "## Overview\n",
    fields: []
  };
  state.templates.push(newTemplate);
  saveState(state);
  applyTemplateSelection(newTemplate);
});

copyButton.addEventListener("click", handleCopy);
insertButton.addEventListener("click", handleInsert);

init();
