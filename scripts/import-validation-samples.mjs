import { validateTemplateImportPayload } from "../src/shared/templating.js";

const samples = [
  {
    name: "missing payload",
    payload: null,
    expectedError: "Import payload must be an object."
  },
  {
    name: "unknown top-level keys",
    payload: { templates: [], extra: true },
    expectedError: "Import payload has unknown keys."
  },
  {
    name: "templates not array",
    payload: { templates: "nope" },
    expectedError: "Import payload templates must be an array."
  },
  {
    name: "empty templates",
    payload: { templates: [] },
    expectedError: "No templates found in import payload."
  },
  {
    name: "template with unknown keys",
    payload: {
      templates: [
        {
          id: "template-1",
          name: "Template",
          description: "",
          template: "Hi {{name}}",
          fields: [],
          extra: "nope"
        }
      ]
    },
    expectedError: "Template contains unknown keys."
  },
  {
    name: "field with invalid type",
    payload: {
      templates: [
        {
          id: "template-1",
          name: "Template",
          description: "",
          template: "Hi {{name}}",
          fields: [
            {
              key: "name",
              label: "Name",
              type: "unknown",
              default: "",
              options: []
            }
          ]
        }
      ]
    },
    expectedError: "Field type is not allowed."
  }
];

let failed = false;

samples.forEach((sample) => {
  const result = validateTemplateImportPayload(sample.payload);
  if (result.valid) {
    failed = true;
    console.error(`FAIL: ${sample.name} should be invalid.`);
    return;
  }
  if (result.error !== sample.expectedError) {
    failed = true;
    console.error(
      `FAIL: ${sample.name} expected "${sample.expectedError}" got "${result.error}".`
    );
  } else {
    console.log(`PASS: ${sample.name}`);
  }
});

if (failed) {
  process.exitCode = 1;
}
