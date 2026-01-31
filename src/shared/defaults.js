export const DEFAULT_TEMPLATES = [
  {
    id: "bug-report",
    name: "Bug Report",
    description: "Structured bug report with context and repro steps",
    template:
      "## Summary\n{{summary}}\n\n## Environment\n{{environment}}\n\n## Steps to Reproduce\n{{steps}}\n\n## Expected Result\n{{expected}}\n\n## Actual Result\n{{actual}}",
    fields: [
      {
        key: "summary",
        label: "Summary",
        type: "text",
        default: "",
        options: []
      },
      {
        key: "environment",
        label: "Environment",
        type: "text",
        default: "",
        options: []
      },
      {
        key: "steps",
        label: "Steps to Reproduce",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "expected",
        label: "Expected Result",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "actual",
        label: "Actual Result",
        type: "text",
        default: "",
        options: []
      }
    ]
  },
  {
    id: "user-story",
    name: "User Story",
    description: "Simple user story layout",
    template:
      "## Story\nAs a {{role}}, I want {{goal}} so that {{benefit}}.\n\n## Acceptance Criteria\n{{criteria}}\n\n## Notes\n{{notes}}",
    fields: [
      {
        key: "role",
        label: "Role",
        type: "text",
        default: "",
        options: []
      },
      {
        key: "goal",
        label: "Goal",
        type: "text",
        default: "",
        options: []
      },
      {
        key: "benefit",
        label: "Benefit",
        type: "text",
        default: "",
        options: []
      },
      {
        key: "criteria",
        label: "Acceptance Criteria",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "notes",
        label: "Notes",
        type: "textarea",
        default: "",
        options: []
      }
    ]
  },
  {
    id: "code-review",
    name: "Code Review",
    description: "Review checklist with focus areas",
    template:
      "## Overview\n{{overview}}\n\n## Risks\n{{risks}}\n\n## Questions\n{{questions}}\n\n## Follow-ups\n{{followups}}",
    fields: [
      {
        key: "overview",
        label: "Overview",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "risks",
        label: "Risks",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "questions",
        label: "Questions",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "followups",
        label: "Follow-ups",
        type: "textarea",
        default: "",
        options: []
      }
    ]
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Capture agenda, decisions, and action items",
    template:
      "## Agenda\n{{agenda}}\n\n## Notes\n{{notes}}\n\n## Decisions\n{{decisions}}\n\n## Action Items\n{{actions}}",
    fields: [
      {
        key: "agenda",
        label: "Agenda",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "notes",
        label: "Notes",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "decisions",
        label: "Decisions",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "actions",
        label: "Action Items",
        type: "textarea",
        default: "",
        options: []
      }
    ]
  },
  {
    id: "prd-outline",
    name: "PRD Outline",
    description: "Product requirements layout",
    template:
      "## Problem\n{{problem}}\n\n## Goals\n{{goals}}\n\n## Non-Goals\n{{nonGoals}}\n\n## Requirements\n{{requirements}}\n\n## Open Questions\n{{questions}}",
    fields: [
      {
        key: "problem",
        label: "Problem",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "goals",
        label: "Goals",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "nonGoals",
        label: "Non-Goals",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "requirements",
        label: "Requirements",
        type: "textarea",
        default: "",
        options: []
      },
      {
        key: "questions",
        label: "Open Questions",
        type: "textarea",
        default: "",
        options: []
      }
    ]
  }
];

export const DEFAULT_STATE = {
  templates: DEFAULT_TEMPLATES,
  pinnedTemplatesByHost: {}
};
