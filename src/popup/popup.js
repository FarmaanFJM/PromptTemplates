import { loadState, saveState } from "../shared/storage.js";
import {
  isValidTemplateSchema,
  renderTemplate,
  validateTemplate
} from "../shared/templating.js";

const templateSelect = document.getElementById("templateSelect");
const templateDescription = document.getElementById("templateDescription");
const fieldsForm = document.getElementById("fieldsForm");
const renderedOutput = document.getElementById("renderedOutput");
const copyButton = document.getElementById("copyButton");
const insertButton = document.getElementById("insertButton");
const statusMessage = document.getElementById("statusMessage");
const pinTemplateButton = document.getElementById("pinTemplateButton");
const shareTemplateButton = document.getElementById("shareTemplateButton");
const importTemplateInput = document.getElementById("importTemplateInput");
const importTemplateButton = document.getElementById("importTemplateButton");
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

function buildSelectOptions() {
  templateSelect.innerHTML = "";
  getOrderedTemplates().forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name || template.id;
    templateSelect.append(option);
  });
}

function buildFieldInput(field) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";

  const label = document.createElement("span");
  label.className = "field__label";
  label.textContent = field.label;

  let input = null;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 3;
  } else if (field.type === "select") {
    input = document.createElement("select");
    field.options.forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      input.append(option);
    });
  } else {
    input = document.createElement("input");
    input.type = "text";
  }

  input.value = fieldValues[field.key] ?? field.default ?? "";
  input.addEventListener("input", () => {
    fieldValues[field.key] = input.value;
    updateRenderedOutput();
  });

  wrapper.append(label, input);
  return wrapper;
}

function renderFields(template) {
  fieldsForm.innerHTML = "";
  fieldValues = {};

  template.fields.forEach((field) => {
    fieldValues[field.key] = field.default ?? "";
  });

  template.fields.forEach((field) => {
    fieldsForm.append(buildFieldInput(field));
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
  const option = templateSelect.querySelector(`option[value="${template.id}"]`);
  if (option) {
    option.textContent = template.name || template.id;
  }
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
      renderFields(template);
    });
    const labelInput = buildEditorInput("Label", field.label, (value) => {
      field.label = value;
      updateTemplate(template);
      renderFields(template);
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
      renderFields(template);
    });
    typeSelect.append(typeLabel, select);

    const defaultInput = buildEditorInput("Default", field.default ?? "", (value) => {
      field.default = value;
      updateTemplate(template);
      renderFields(template);
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
          renderFields(template);
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
      renderFields(template);
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
      renderFields(template);
    });

    const removeButton = document.createElement("button");
    removeButton.className = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      template.fields.splice(index, 1);
      updateTemplate(template);
      renderFieldsEditor(template);
      renderFields(template);
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

function updateTemplate(template) {
  updateTemplateSelectLabel(template);
  templateDescription.textContent = template.description;
  updatePinButton(template);
  renderWarnings(template);
  updateRenderedOutput();
  saveState(state);
}

function updateRenderedOutput() {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    renderedOutput.value = "";
    return;
  }
  renderedOutput.value = renderTemplate(template.template, fieldValues);
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

  buildSelectOptions();
  currentTemplateId = state.templates[0]?.id ?? null;

  if (currentTemplateId) {
    templateSelect.value = currentTemplateId;
    const template = getTemplateById(currentTemplateId);
    templateDescription.textContent = template.description;
    renderFields(template);
    updateEditor(template);
    renderWarnings(template);
    updatePinButton(template);
    updateRenderedOutput();
  } else {
    renderWarnings(null);
    updatePinButton(null);
  }
}

templateSelect.addEventListener("change", () => {
  currentTemplateId = templateSelect.value;
  const template = getTemplateById(currentTemplateId);
  templateDescription.textContent = template.description;
  renderFields(template);
  updateEditor(template);
  renderWarnings(template);
  updatePinButton(template);
  updateRenderedOutput();
});

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
  buildSelectOptions();
  templateSelect.value = template.id;
  updatePinButton(template);
});

shareTemplateButton.addEventListener("click", async () => {
  const template = getTemplateById(currentTemplateId);
  if (!template) {
    setStatus("No template selected.");
    return;
  }
  const payload = encodeShareTemplate(template);
  try {
    await navigator.clipboard.writeText(payload);
    setStatus("Share link copied.");
  } catch (error) {
    setStatus("Unable to copy share link.");
  }
});

importTemplateButton.addEventListener("click", () => {
  const value = importTemplateInput.value.trim();
  if (!value.startsWith(SHARE_PREFIX)) {
    setStatus("Invalid share link.");
    return;
  }
  const template = decodeShareTemplate(value);
  if (!template || !isValidTemplateSchema(template)) {
    setStatus("Malformed template data.");
    return;
  }
  const exists = state.templates.some((item) => item.id === template.id);
  const newTemplate = { ...template };
  if (exists) {
    newTemplate.id = generateTemplateId();
  }
  state.templates.push(newTemplate);
  saveState(state);
  buildSelectOptions();
  currentTemplateId = newTemplate.id;
  templateSelect.value = currentTemplateId;
  templateDescription.textContent = newTemplate.description;
  renderFields(newTemplate);
  updateEditor(newTemplate);
  renderWarnings(newTemplate);
  updatePinButton(newTemplate);
  updateRenderedOutput();
  importTemplateInput.value = "";
  setStatus("Template imported.");
});

newTemplateButton.addEventListener("click", () => {
  const newTemplate = {
    id: generateTemplateId(),
    name: "New template",
    description: "",
    template: "",
    fields: []
  };
  state.templates.push(newTemplate);
  saveState(state);
  buildSelectOptions();
  currentTemplateId = newTemplate.id;
  templateSelect.value = currentTemplateId;
  templateDescription.textContent = newTemplate.description;
  renderFields(newTemplate);
  updateEditor(newTemplate);
  renderWarnings(newTemplate);
  updatePinButton(newTemplate);
  updateRenderedOutput();
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
  buildSelectOptions();
  currentTemplateId = state.templates[0]?.id ?? null;
  if (currentTemplateId) {
    templateSelect.value = currentTemplateId;
    const template = getTemplateById(currentTemplateId);
    templateDescription.textContent = template.description;
    renderFields(template);
    updateEditor(template);
    renderWarnings(template);
    updatePinButton(template);
    updateRenderedOutput();
  } else {
    templateDescription.textContent = "";
    fieldsForm.innerHTML = "";
    fieldsEditorList.innerHTML = "";
    renderedOutput.value = "";
    editorName.value = "";
    editorDescription.value = "";
    editorTemplate.value = "";
    renderWarnings(null);
    updatePinButton(null);
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
  renderFields(template);
});

copyButton.addEventListener("click", handleCopy);
insertButton.addEventListener("click", handleInsert);

init();
