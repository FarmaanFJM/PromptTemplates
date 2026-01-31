export const DEFAULT_TEMPLATES = [
  {
    id: "welcome-message",
    name: "Welcome message",
    description: "A friendly introduction",
    template: "Hi {{name}},\n\nThanks for reaching out about {{topic}}.",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        default: "",
        options: []
      },
      {
        key: "topic",
        label: "Topic",
        type: "text",
        default: "your request",
        options: []
      }
    ]
  }
];

export const DEFAULT_STATE = {
  templates: DEFAULT_TEMPLATES,
  pinnedTemplatesByHost: {}
};
