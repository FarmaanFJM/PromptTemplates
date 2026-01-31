import { loadState, saveState } from "../shared/storage.js";
import {
  extractOverviewTokens,
  isValidTemplateSchema,
  renderTemplate
} from "../shared/templating.js";

const templateList = document.getElementById("templateList");
const templateDescription = document.getElementById("templateDescription");
const promptTemplateInput = document.getElementById("promptTemplateInput");
const overviewInputs = document.getElementById("overviewInputs");
const renderedOutput = document.getElementById("renderedOutput");
const exportTemplateOutput = document.getElementById("exportTemplateOutput");
const exportCopyButton = document.getElementById("exportCopyButton");
const importTemplateInput = document.getElementById("importTemplateInput");
const importTemplateButton = document.getElementById("importTemplateButton");
const importStatus = document.getElementById("importStatus");
const copyButton = document.getElementById("copyButton");
const insertButton = document.getElementById("insertButton");
const newTemplateButton = document.getElementById("newTemplateButton");
const statusMessage = document.getElementById("statusMessage");
const themeToggle = document.getElementById("themeToggle");

let state = null;
let currentTemplateId = null;
let variableValues = {};
let blockValues = {};
let statusTimeout = null;
let currentTheme = "light";

const SHARE_PREFIX = "prompttemplate://";

function setStatus(message) {
  statusMessage.textContent = message;
  if (!message) {
    statusMessage.classList.remove("toast--visible");
    return;
  }
  statusMessage.classList.add("toast--visible");
  if (statusTimeout) {
    window.clearTimeout(statusTimeout);
  }
  statusTimeout = window.setTimeout(() => {
    statusMessage.classList.remove("toast--visible");
  }, 2200);
}

function setImportStatus(message) {
  importStatus.textContent = message;
}

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("theme--dark", currentTheme === "dark");
  themeToggle.textContent =
    currentTheme === "dark" ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-pressed", currentTheme === "dark");
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

function renderTemplateInputs(template) {
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
  const tokens = extractOverviewTokens(template.template);

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
  promptTemplateInput.value = template.template;
  renderTemplateInputs(template);
}

async function init() {
  state = await loadState();
  if (!state.templates.length) {
    state.templates = [];
    await saveState(state);
  }
  if (!state.theme) {
    state.theme = "light";
    await saveState(state);
  }

  buildTemplateList();
  applyTheme(state.theme);
  currentTemplateId = state.templates[0]?.id ?? null;

  if (currentTemplateId) {
    const template = getTemplateById(currentTemplateId);
    applyTemplateSelection(template);
  }
}

promptTemplateInput.addEventListener("input", () => {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    return;
  }
  template.template = promptTemplateInput.value;
  saveState(state);
  renderTemplateInputs(template);
});

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
    template: "Hi {{name}},\n\nThanks for reaching out about {{topic}}.",
    fields: []
  };
  state.templates.push(newTemplate);
  saveState(state);
  applyTemplateSelection(newTemplate);
});

copyButton.addEventListener("click", handleCopy);
themeToggle.addEventListener("click", () => {
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  state.theme = nextTheme;
  applyTheme(nextTheme);
  saveState(state);
});

init();
