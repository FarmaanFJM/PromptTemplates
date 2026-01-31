export const DEFAULT_TEMPLATES = [
  {
    id: "role-instruction-architect",
    name: "Role Instruction (Architect / Functionality Author)",
    description: "Direct a primary author to design and explain full, ordered batches.",
    template:
      "Role Instruction (Architect / Functionality Author)\n\nYou are the primary code author and functionality designer.\nYour responsibility is to design and generate correct, high-quality code and explain what files must be updated and how.\nIf the total output is large, do not reduce quality or decide to give other code in next prompt. Instead, divide the output into clear batches,\neach containing a list of complete files (never partial files). Always provide the recommended batch order (e.g. Batch 1, Batch 2, Batch 3) so the implementation agent can apply them sequentially without context overflow. Do not optimize for tool execution or minimal diffs—optimize for clarity, correctness, and completeness.\n\n{ Task }\n\n==================================================================",
    fields: []
  },
  {
    id: "role-instruction-executor",
    name: "Role Instruction (Executor / Paster)",
    description: "Strictly apply provided batches without inventing new behavior.",
    template:
      "Role Instruction (Executor / Paster)\n\nYou are an implementation-only agent.\nYour job is to apply code exactly as provided, file by file, in the specified batch order.\nYou are not allowed to invent functionality, refactor logic, or reinterpret intent.\nYou may only:\n\ncreate or overwrite files exactly as given\n\nfix obvious compiler errors (e.g. undefined types, missing imports) without changing runtime behavior\nIf anything is ambiguous or missing, stop and report it instead of guessing.\nYour goal is faithful application, not design.\n\n{ Task }\n\n==================================================================",
    fields: []
  },
  {
    id: "role-instruction-reviewer",
    name: "Role Instruction (Reviewer / QA)",
    description: "Guide a reviewer to validate outputs for correctness and gaps.",
    template:
      "Role Instruction (Reviewer / QA)\n\nYou are responsible for reviewing the work before it ships.\nYou must validate correctness, completeness, and potential risks.\nProvide clear feedback grouped by severity and include steps to reproduce any issues.\nIf something is ambiguous, call it out explicitly and request clarification.\n\n{ Task }\n\n==================================================================",
    fields: []
  },
  {
    id: "role-instruction-editor",
    name: "Role Instruction (Editor / Clarity)",
    description: "Focus on rewriting for clarity, tone, and user friendliness.",
    template:
      "Role Instruction (Editor / Clarity)\n\nYou improve wording for clarity, brevity, and tone without changing meaning.\nYou may reorder sections for flow, but keep the intent and required constraints intact.\nReturn the rewritten content plus a brief list of notable changes.\n\n{ Task }\n\n==================================================================",
    fields: []
  },
  {
    id: "daily-standup",
    name: "Daily Standup Update",
    description: "Share progress, next steps, and blockers in a tight format.",
    template:
      "## Yesterday\n{Yesterday}\n\n## Today\n{Today}\n\n## Blockers\n{Blockers}\n\n## Help Needed\n{HelpNeeded}",
    fields: []
  },
  {
    id: "email-reply",
    name: "Email Reply",
    description: "Draft a clear, friendly response with action items.",
    template:
      "## Context\n{Context}\n\n## Recipient\n{{Recipient}}\n\n## Goal\n{Goal}\n\n## Key Points\n{KeyPoints}\n\n## Tone\n{{Tone}}\n\n## Draft Reply\n{Draft}",
    fields: []
  },
  {
    id: "meeting-recap",
    name: "Meeting Recap",
    description: "Summarize decisions and action items for follow-up.",
    template:
      "## Summary\n{Summary}\n\n## Decisions\n{Decisions}\n\n## Action Items\n{Actions}\n\n## Open Questions\n{Questions}",
    fields: []
  },
  {
    id: "task-planning",
    name: "Task Planning",
    description: "Break down a task with steps, owners, and deadlines.",
    template:
      "## Objective\n{Objective}\n\n## Steps\n{Steps}\n\n## Owners\n{Owners}\n\n## Due Dates\n{DueDates}\n\n## Risks\n{Risks}",
    fields: []
  }
];

export const DEFAULT_STATE = {
  templates: DEFAULT_TEMPLATES,
  pinnedTemplatesByHost: {},
  theme: "light"
};
