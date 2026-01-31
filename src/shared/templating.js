export function renderTemplate(template, values) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const normalizedKey = key.trim();
    if (Object.prototype.hasOwnProperty.call(values, normalizedKey)) {
      return String(values[normalizedKey]);
    }
    return match;
  });
}

export function extractPlaceholders(template) {
  const placeholders = new Set();
  const regex = /\{\{([^}]+)\}\}/g;
  let match = regex.exec(template);
  while (match) {
    placeholders.add(match[1].trim());
    match = regex.exec(template);
  }
  return Array.from(placeholders);
}

export function validateTemplate(template, fields) {
  const placeholders = extractPlaceholders(template);
  const fieldKeys = fields.map((field) => field.key);
  const fieldKeySet = new Set(fieldKeys);

  const unknownPlaceholders = placeholders.filter(
    (placeholder) => !fieldKeySet.has(placeholder)
  );
  const unusedFields = Array.from(
    new Set(fieldKeys.filter((fieldKey) => !placeholders.includes(fieldKey)))
  );

  return {
    unknownPlaceholders: unknownPlaceholders.sort(),
    unusedFields: unusedFields.sort()
  };
}

export function isValidTemplateSchema(template) {
  if (!template || typeof template !== "object") {
    return false;
  }
  const { id, name, description, template: rawTemplate, fields } = template;
  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof rawTemplate !== "string" ||
    !Array.isArray(fields)
  ) {
    return false;
  }

  return fields.every((field) => {
    if (!field || typeof field !== "object") {
      return false;
    }
    const { key, label, type, default: defaultValue, options } = field;
    if (
      typeof key !== "string" ||
      typeof label !== "string" ||
      typeof type !== "string"
    ) {
      return false;
    }
    const allowedTypes = ["text", "textarea", "select"];
    if (!allowedTypes.includes(type)) {
      return false;
    }
    if (typeof defaultValue !== "string") {
      return false;
    }
    if (type === "select") {
      if (!Array.isArray(options)) {
        return false;
      }
      return options.every((option) => typeof option === "string");
    }
    return Array.isArray(options);
  });
}

export function splitTemplateSections(template) {
  const lines = template.split("\n");
  const sections = [];
  let current = null;

  lines.forEach((line) => {
    if (line.startsWith("## ")) {
      if (current) {
        sections.push(current);
      }
      current = { title: line.slice(3).trim(), content: "" };
      return;
    }

    if (!current) {
      current = { title: "Overview", content: "" };
    }

    current.content = current.content
      ? `${current.content}\n${line}`
      : line;
  });

  if (current) {
    sections.push(current);
  }

  return sections;
}

export function composeTemplateSections(sections) {
  return sections
    .map((section) => {
      const header = `## ${section.title}`;
      const body = section.content.trim();
      return body ? `${header}\n${body}` : header;
    })
    .join("\n\n");
}

export function extractOverviewTokens(text) {
  const parts = [];
  const variables = new Set();
  const blocks = new Set();
  const regex = /\{\{([^}]+)\}\}|\{(?!\{)([^}]+)\}/g;
  let lastIndex = 0;
  let match = regex.exec(text);
  while (match) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      const key = match[1].trim();
      variables.add(key);
      parts.push({ type: "variable", label: `{{${key}}}` });
    } else if (match[2]) {
      const key = match[2].trim();
      blocks.add(key);
      parts.push({ type: "block", label: `{${key}}` });
    }
    lastIndex = regex.lastIndex;
    match = regex.exec(text);
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return {
    parts,
    variables: Array.from(variables),
    blocks: Array.from(blocks)
  };
}
