export const VIEW_DEFINITIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    section: "Overview",
    title: "Dashboard",
    renderer: "placeholder",
    content: {
      heading: "A quick home base for your tapestry collection.",
      description:
        "This default view is ready for future collection summaries, recent additions, reminders, and status cards."
    }
  },
  {
    id: "items",
    label: "Item details",
    icon: "items",
    section: "Database",
    title: "Item details",
    renderer: "placeholder",
    content: {
      heading: "Browse, filter, and maintain registered entries.",
      description:
        "This area is reserved for searchable tables, item records, editing controls, and collection filtering."
    }
  },
  {
    id: "add",
    label: "Add item",
    icon: "add",
    section: "Registration",
    title: "Add item",
    renderer: "placeholder",
    content: {
      heading: "Register new tapestries into the system.",
      description:
        "This view will later hold the form workflow for adding purchases, photos, metadata, storage locations, and notes."
    }
  },
  {
    id: "administration",
    label: "Administration",
    icon: "administration",
    section: "Database setup",
    title: "Administration",
    renderer: "placeholder",
    content: {
      heading: "Adjust the structure and options of the database.",
      description:
        "Future tools can live here for managing fields, categories, lookup values, import rules, and database maintenance."
    }
  },
  {
    id: "options",
    label: "Options",
    icon: "options",
    section: "Application",
    title: "Options",
    renderer: "options"
  }
];

export function getViewById(viewId) {
  return VIEW_DEFINITIONS.find((view) => view.id === viewId) ?? VIEW_DEFINITIONS[0];
}
