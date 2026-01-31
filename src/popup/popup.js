import { loadState, saveState } from "../shared/storage.js";
import {
  composeTemplateSections,
  isValidTemplateSchema,
  renderTemplate,
  splitTemplateSections,
  validateTemplate
} from "../shared/templating.js";

const templateList = document.getElementById("templateList");
const previewTitle = document.getElementById("previewTitle");
const templateDescription = document.getElementById("templateDescription");
const previewSections = document.getElementById("previewSections");
const exportTemplateOutput = document.getElementById("exportTemplateOutput");
const exportCopyButton = document.getElementById("exportCopyButton");
const importTemplateInput = document.getElementById("importTemplateInput");
const importTemplateButton = document.getElementById("importTemplateButton");
const importStatus = document.getElementById("importStatus");
const copyButton = document.getElementById("copyButton");
const insertButton = document.getElementById("insertButton");
const statusMessage = document.getElementById("statusMessage");
const pinTemplateButton = document.getElementById("pinTemplateButton");
const newTemplateButton = document.getElementById("newTemplateButton");
const deleteTemplateButton = document.getElementById("deleteTemplateButton");
const editorName = document.getElementById("editorName");
const editorDescription = document.getElementById("editorDescription");
const editorTemplate = document.getElementById("editorTemplate");
const addFieldButton = document.getElementById("addFieldButton");
const fieldsEditorList = document.getElementById("fieldsEditorList");
const unknownPlaceholdersList = document.getElementById("unknownPlaceholdersList");
const unusedFieldsList = document.getElementById("unusedFieldsList");
const warningsEmpty = document.getElementById("warningsEmpty");

let state = null;
let currentTemplateId = null;
let fieldValues = {};
let currentHostname = null;

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

function setDefaultFieldValues(template) {
  fieldValues = {};
  if (!template) {
    return;
  }
  template.fields.forEach((field) => {
    fieldValues[field.key] = field.default ?? "";
  });
}

function buildTemplateList() {
  templateList.innerHTML = "";
  getOrderedTemplates().forEach((template) => {
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

function renderWarnings(template) {
  unknownPlaceholdersList.innerHTML = "";
  unusedFieldsList.innerHTML = "";

  if (!template) {
    warningsEmpty.textContent = "No warnings.";
    return;
  }

  const { unknownPlaceholders, unusedFields } = validateTemplate(
    template.template,
    template.fields
  );

  unknownPlaceholders.forEach((placeholder) => {
    const item = document.createElement("li");
    item.textContent = placeholder;
    unknownPlaceholdersList.append(item);
  });

  unusedFields.forEach((fieldKey) => {
    const item = document.createElement("li");
    item.textContent = fieldKey;
    unusedFieldsList.append(item);
  });

  warningsEmpty.textContent =
    unknownPlaceholders.length || unusedFields.length
      ? ""
      : "No warnings.";
}

function updateTemplateSelectLabel(template) {
  buildTemplateList();
}

function updatePinButton(template) {
  if (!currentHostname || !template) {
    pinTemplateButton.disabled = true;
    pinTemplateButton.textContent = "Pin";
    return;
  }
  pinTemplateButton.disabled = false;
  const pinned = getPinnedTemplateIds().includes(template.id);
  pinTemplateButton.textContent = pinned ? "Unpin" : "Pin";
}

function updateEditor(template) {
  editorName.value = template.name;
  editorDescription.value = template.description;
  editorTemplate.value = template.template;
  renderFieldsEditor(template);
}

function renderFieldsEditor(template) {
  fieldsEditorList.innerHTML = "";

  template.fields.forEach((field, index) => {
    const row = document.createElement("div");
    row.className = "field-row";

    const inputs = document.createElement("div");
    inputs.className = "field-row__inputs";

    const keyInput = buildEditorInput("Key", field.key, (value) => {
      field.key = value;
      updateTemplate(template);
    });
    const labelInput = buildEditorInput("Label", field.label, (value) => {
      field.label = value;
      updateTemplate(template);
    });

    const typeSelect = document.createElement("label");
    typeSelect.className = "field";
    const typeLabel = document.createElement("span");
    typeLabel.className = "field__label";
    typeLabel.textContent = "Type";
    const select = document.createElement("select");
    ["text", "textarea", "select"].forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      select.append(option);
    });
    select.value = field.type;
    select.addEventListener("change", () => {
      field.type = select.value;
      if (field.type !== "select") {
        field.options = [];
      }
      updateTemplate(template);
      renderFieldsEditor(template);
    });
    typeSelect.append(typeLabel, select);

    const defaultInput = buildEditorInput("Default", field.default ?? "", (value) => {
      field.default = value;
      updateTemplate(template);
    });

    inputs.append(keyInput, labelInput, typeSelect, defaultInput);

    if (field.type === "select") {
      const optionsInput = buildEditorInput(
        "Options (comma separated)",
        field.options.join(", "),
        (value) => {
          field.options = value
            .split(",")
            .map((option) => option.trim())
            .filter(Boolean);
          updateTemplate(template);
        }
      );
      inputs.append(optionsInput);
    }

    const controls = document.createElement("div");
    controls.className = "field-row__controls";

    const moveUp = document.createElement("button");
    moveUp.className = "button";
    moveUp.textContent = "Up";
    moveUp.disabled = index === 0;
    moveUp.addEventListener("click", () => {
      const temp = template.fields[index - 1];
      template.fields[index - 1] = template.fields[index];
      template.fields[index] = temp;
      updateTemplate(template);
      renderFieldsEditor(template);
    });

    const moveDown = document.createElement("button");
    moveDown.className = "button";
    moveDown.textContent = "Down";
    moveDown.disabled = index === template.fields.length - 1;
    moveDown.addEventListener("click", () => {
      const temp = template.fields[index + 1];
      template.fields[index + 1] = template.fields[index];
      template.fields[index] = temp;
      updateTemplate(template);
      renderFieldsEditor(template);
    });

    const removeButton = document.createElement("button");
    removeButton.className = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      template.fields.splice(index, 1);
      updateTemplate(template);
      renderFieldsEditor(template);
    });

    controls.append(moveUp, moveDown, removeButton);
    row.append(inputs, controls);
    fieldsEditorList.append(row);
  });
}

function buildEditorInput(labelText, value, onChange) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";

  const label = document.createElement("span");
  label.className = "field__label";
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.addEventListener("input", () => {
    onChange(input.value);
  });

  wrapper.append(label, input);
  return wrapper;
}

function renderPreview(template) {
  previewSections.innerHTML = "";
  if (!template) {
    previewTitle.textContent = "Select a layout";
    templateDescription.textContent = "";
    exportTemplateOutput.value = "";
    return;
  }

  previewTitle.textContent = template.name || template.id;
  templateDescription.textContent = template.description;

  const sections = splitTemplateSections(template.template);
  sections.forEach((section, index) => {
    const container = document.createElement("div");
    container.className = "field";

    const label = document.createElement("span");
    label.className = "preview-section__header";
    label.textContent = section.title;

    const textarea = document.createElement("textarea");
    textarea.className = "field__input";
    textarea.rows = 4;
    textarea.value = section.content.trim();
    textarea.addEventListener("input", () => {
      sections[index].content = textarea.value;
      template.template = composeTemplateSections(sections);
      editorTemplate.value = template.template;
      renderWarnings(template);
      setDefaultFieldValues(template);
      updateRenderedOutput();
      exportTemplateOutput.value = encodeShareTemplate(template);
      saveState(state);
    });

    container.append(label, textarea);
    previewSections.append(container);
  });

  exportTemplateOutput.value = encodeShareTemplate(template);
}

function updateTemplate(template) {
  updateTemplateSelectLabel(template);
  updatePinButton(template);
  renderWarnings(template);
  renderPreview(template);
  setDefaultFieldValues(template);
  updateRenderedOutput();
  saveState(state);
}

function updateRenderedOutput() {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    return "";
  }
  return renderTemplate(template.template, fieldValues);
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(updateRenderedOutput());
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
      payload: updateRenderedOutput()
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

async function loadCurrentHostname() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      return null;
    }
    return new URL(tab.url).hostname;
  } catch (error) {
    return null;
  }
}

function getPinnedTemplateIds() {
  if (!currentHostname) {
    return [];
  }
  return state.pinnedTemplatesByHost[currentHostname] ?? [];
}

function getOrderedTemplates() {
  const templates = state.templates;
  if (!currentHostname) {
    return templates;
  }
  const pinnedIds = getPinnedTemplateIds();
  const pinnedTemplates = pinnedIds
    .map((id) => templates.find((template) => template.id === id))
    .filter(Boolean);
  const pinnedSet = new Set(pinnedTemplates.map((template) => template.id));
  const remaining = templates.filter((template) => !pinnedSet.has(template.id));
  return [...pinnedTemplates, ...remaining];
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

function removeTemplateFromPinned(templateId) {
  Object.keys(state.pinnedTemplatesByHost).forEach((host) => {
    state.pinnedTemplatesByHost[host] = state.pinnedTemplatesByHost[host].filter(
      (id) => id !== templateId
    );
  });
}

function applyTemplateSelection(template) {
  currentTemplateId = template.id;
  setDefaultFieldValues(template);
  buildTemplateList();
  updateEditor(template);
  renderWarnings(template);
  updatePinButton(template);
  renderPreview(template);
  updateRenderedOutput();
}

async function init() {
  state = await loadState();
  if (!state.pinnedTemplatesByHost) {
    state.pinnedTemplatesByHost = {};
    await saveState(state);
  }
  if (!state.templates.length) {
    state.templates = [];
    await saveState(state);
  }
  currentHostname = await loadCurrentHostname();

  buildTemplateList();
  currentTemplateId = state.templates[0]?.id ?? null;

  if (currentTemplateId) {
    const template = getTemplateById(currentTemplateId);
    applyTemplateSelection(template);
  } else {
    renderWarnings(null);
    updatePinButton(null);
  }
}

pinTemplateButton.addEventListener("click", () => {
  const template = getTemplateById(currentTemplateId);
  if (!template || !currentHostname) {
    setStatus("No active site to pin this template.");
    return;
  }
  const pinned = getPinnedTemplateIds();
  const index = pinned.indexOf(template.id);
  if (index === -1) {
    pinned.push(template.id);
  } else {
    pinned.splice(index, 1);
  }
  state.pinnedTemplatesByHost[currentHostname] = pinned;
  saveState(state);
  buildTemplateList();
  updatePinButton(template);
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
    template: "## Overview\n",
    fields: []
  };
  state.templates.push(newTemplate);
  saveState(state);
  applyTemplateSelection(newTemplate);
});

deleteTemplateButton.addEventListener("click", () => {
  if (!currentTemplateId) {
    return;
  }
  const index = state.templates.findIndex(
    (template) => template.id === currentTemplateId
  );
  if (index === -1) {
    return;
  }
  const deletedTemplate = state.templates[index];
  state.templates.splice(index, 1);
  removeTemplateFromPinned(deletedTemplate.id);
  saveState(state);
  buildTemplateList();
  currentTemplateId = state.templates[0]?.id ?? null;
  if (currentTemplateId) {
    const template = getTemplateById(currentTemplateId);
    applyTemplateSelection(template);
  } else {
    templateDescription.textContent = "";
    fieldsEditorList.innerHTML = "";
    editorName.value = "";
    editorDescription.value = "";
    editorTemplate.value = "";
    renderWarnings(null);
    updatePinButton(null);
    previewTitle.textContent = "Select a layout";
    previewSections.innerHTML = "";
    exportTemplateOutput.value = "";
  }
});

editorName.addEventListener("input", () => {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    return;
  }
  template.name = editorName.value;
  updateTemplate(template);
});

editorDescription.addEventListener("input", () => {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    return;
  }
  template.description = editorDescription.value;
  updateTemplate(template);
});

editorTemplate.addEventListener("input", () => {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    return;
  }
  template.template = editorTemplate.value;
  updateTemplate(template);
  renderPreview(template);
});

addFieldButton.addEventListener("click", () => {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    return;
  }
  template.fields.push({
    key: "",
    label: "",
    type: "text",
    default: "",
    options: []
  });
  updateTemplate(template);
  renderFieldsEditor(template);
});

copyButton.addEventListener("click", handleCopy);
insertButton.addEventListener("click", handleInsert);

init();
