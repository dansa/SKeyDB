export type ChangelogItem = {
  date: string;
  summary: string;
};

export const changelogItems: ChangelogItem[] = [
  {
    date: "2026-02-27",
    summary:
      "WIP support for ingame team codes was added, including import and export, giga thanks to Zekie, Frost and Fish for the help mapping out characters and wheel codes!"
  },
  {
    date: "2026-02-27",
    summary:
      "Lots of various QoL improvements, couple of fixes and changes. You can review 2026-02-23 in the docs folder on github for a more detailed changelog in this pass, and what's planned for the future.",
  },
  {
    date: "2026-02-26",
    summary:
      "Builder and Collection both got a pretty big UI polish pass: tabbed layouts, cleaner toolbars, hopefully easier to navigate and use the pages now."
  },
  {
    date: "2026-02-25 (ish)",
    summary:
      "Sorting was introduced for the collection and other pages, which hopefully resembles what you'd expect to see ingame."
  },
  {
    date: "2026-02-24",
    summary:
      "Collection now supports editable awakener Lv. tracking (1-90), plus that level is shown on builder cards too.",
  },
  {
    date: "2026-02-24",
    summary:
      "Box export in /collection got a big glow-up: live preview controls, cleaner styling, and more reliable PNG output across browsers.",
  },
  {
    date: "2026-02-23",
    summary:
      "Added our very first branding! A very cute key icon (favicon) made by lavenderjun0!",
  },
  {
    date: "2026-02-23",
    summary:
      "Collection ownership tracking is now live with quick toggles, level controls, and local persistence.",
  },
  {
    date: "2026-02-23",
    summary:
      "Collection data can now be saved to and loaded from a local snapshot file.",
  },
  {
    date: "2026-02-22",
    summary:
      "Wheel filters got smarter, so it is easier to find what you want quickly.",
  },
  {
    date: "2026-02-22",
    summary:
      "Wheel and covenant handling in the builder became more polished and consistent.",
  },
  {
    date: "2026-02-22",
    summary:
      "The builder now supports wheel slots and covenant slots as part of normal team setup.",
  },
  {
    date: "2026-02-22",
    summary:
      "Import and export flow was streamlined so sharing teams is faster and cleaner.",
  },
  {
    date: "2026-02-21",
    summary:
      "Multi-team planning was added, including cleaner team switching and better team management.",
  },
  {
    date: "2026-02-21",
    summary:
      "Safer move and replace behavior was added when editing teams with existing picks.",
  },
  {
    date: "2026-02-20",
    summary:
      "Active slot interactions were improved to make card editing more clear while building.",
  },
  {
    date: "2026-02-20",
    summary:
      "Project docs and deployment flow were prepared for public testing builds.",
  },
  {
    date: "2026-02-20",
    summary:
      "SKeyDB naming and base builder flow were set up as the first public-ready foundation.",
  },
  {
    date: "2025-12-something",
    summary:
      "Project was started and swiftly put on indefinite hold due to lack of assets and resources.. 8)",
  },
];
