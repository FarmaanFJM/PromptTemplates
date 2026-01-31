export const DEFAULT_TEMPLATES = [
  {
    id: "design-brief",
    name: "Design Brief",
    description: "Clarify goals, context, and output requirements before writing prompts.",
    template:
      "## Context\n{Context}\n\n## Objective\n{Objective}\n\n## Audience\n{{Audience}}\n\n## Tone & Style\n{{Tone}}\n\n## Constraints\n{Constraints}\n\n## Output Requirements\n{OutputRequirements}\n\n## Success Criteria\n{SuccessCriteria}",
    fields: []
  },
  {
    id: "execution-plan",
    name: "Execution Plan",
    description: "Align delivery steps, files, and validation before implementing.",
    template:
      "## Summary\n{Summary}\n\n## Plan\n{Plan}\n\n## Files & Areas\n{Files}\n\n## Risks & Mitigations\n{Risks}\n\n## Validation\n{Validation}",
    fields: []
  },
  {
    id: "review-checklist",
    name: "Review Checklist",
    description: "Capture what to verify and edge cases before final output.",
    template:
      "## Scope\n{Scope}\n\n## Checks\n{Checks}\n\n## Edge Cases\n{EdgeCases}\n\n## Notes\n{Notes}",
    fields: []
  },
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
  }
];

export const DEFAULT_STATE = {
  templates: DEFAULT_TEMPLATES,
  pinnedTemplatesByHost: {}
};
