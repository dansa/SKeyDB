import { useState } from "react";
import { FaDiscord, FaGithub } from "react-icons/fa6";
import emojiAel from "../assets/emoji/Emoji_AEL_E_05.png";

type TaskStatus = "planned" | "in_progress" | "done" | "forever_in_progress";

type TaskItem = {
  label: string;
  status: TaskStatus;
};

type ChangelogItem = {
  date: string;
  summary: string;
};

const builderTasks: TaskItem[] = [
  { label: "Local storage persistence", status: "planned" },
  { label: "Mobile-first builder layout pass", status: "planned" },
  { label: "Quick Select flow for faster team fill", status: "planned" },
  { label: "General QoL and things", status: "forever_in_progress" },
];

const databaseTasks: TaskItem[] = [
  { label: "UI structure for data browsing", status: "planned" },
  { label: "Data integration from the legacy database", status: "planned" },
  { label: "Schema and data coverage expansion", status: "in_progress" },
];

const resourceTasks: TaskItem[] = [
  { label: "Useful links and tools page", status: "planned" },
];

const changelogItems: ChangelogItem[] = [
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
];

const statusLabel: Record<TaskStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
  forever_in_progress: "Forever In Progress",
};

const statusClassName: Record<TaskStatus, string> = {
  planned: "border-slate-400/40 text-slate-200",
  in_progress: "border-sky-300/45 text-sky-200",
  done: "border-emerald-300/45 text-emerald-200",
  forever_in_progress: "border-violet-300/45 text-violet-200",
};

export function HomePage() {
  const [showAllChangelog, setShowAllChangelog] = useState(false);
  const visibleChangelogItems = showAllChangelog
    ? changelogItems
    : changelogItems.slice(0, 5);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center gap-3 border border-amber-200/35 bg-slate-900/40 p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
        <img
          alt="Morimens emoji"
          className="h-12 w-12 object-contain"
          src={emojiAel}
        />
        <div className="min-w-0">
          <h2 className="ui-title text-2xl text-amber-100 md:text-3xl">
            SKeyDB Overview
          </h2>
          <p className="text-sm text-slate-300">
            Community project for Morimens data and team planning tools.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          description="Database for Morimens with awakeners, wheels, and related data. Deep filtering and richer details are still being built."
          title="Database (In Progress)"
        />
        <InfoCard
          description="Interactive Team Planner / Builder with drag and drop, team rules, import/export, and multi-team workflow. Stable enough for public testing."
          title="Team Builder (Stable Beta)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RoadmapCard items={builderTasks} title="Builder Tracker" />
        <RoadmapCard items={databaseTasks} title="Database Tracker" />
        <RoadmapCard items={resourceTasks} title="Resources Tracker" />
      </div>

      <article className="border border-slate-500/45 bg-slate-900/55 p-4">
        <h3 className="ui-title text-lg text-amber-100">Recent Changelog</h3>
        <p className="mt-1 text-xs text-slate-400">
          Showing {visibleChangelogItems.length} of {changelogItems.length}{" "}
          entries
        </p>
        <ul className="mt-2 space-y-2 text-sm text-slate-200">
          {visibleChangelogItems.map((item) => (
            <li
              className="flex flex-wrap items-center gap-x-2 gap-y-1"
              key={`${item.date}-${item.summary}`}
            >
              <span className="rounded border border-amber-200/35 bg-slate-900/70 px-2 py-0.5 text-xs text-amber-100">
                {item.date}
              </span>
              <span>{item.summary}</span>
            </li>
          ))}
        </ul>
        {changelogItems.length > 5 ? (
          <button
            className="mt-3 border border-slate-500/45 bg-slate-900/65 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-amber-200/50 hover:text-amber-100"
            onClick={() => setShowAllChangelog((current) => !current)}
            type="button"
          >
            {showAllChangelog ? "Show Recent Only" : "Show Full Timeline"}
          </button>
        ) : null}
      </article>

      <article className="border border-amber-200/35 bg-slate-900/40 p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
        <h3 className="ui-title text-lg text-amber-100">
          Contact and Community
        </h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-200">
          <li className="flex items-center gap-2">
            <FaDiscord aria-hidden className="text-base text-slate-300" />
            Community Discord:{" "}
            <a
              className="text-amber-200 hover:text-amber-100"
              href="https://discord.gg/b3T723SUJU"
            >
              Mythag University
            </a>
          </li>

          <li className="flex items-center gap-2">
            <FaGithub aria-hidden className="text-base text-slate-300" />
            GitHub:{" "}
            <a
              className="text-amber-200 hover:text-amber-100"
              href="https://github.com/dansa/SKeyDB"
            >
              @SKeyDB
            </a>
          </li>
          <li className="flex items-center gap-2">
            <FaDiscord aria-hidden className="text-base text-slate-300" />
            Project contact (Discord):{" "}
            <a
              className="text-amber-200 hover:text-amber-100"
              href="https://discord.com/users/fjantsa"
            >
              @Fjant (fjantsa) - DMs open for questions, issues, angry messages,
              and mild existential debugging
            </a>
          </li>
        </ul>
      </article>

      <article className="border border-slate-500/45 bg-slate-900/55 p-4">
        <h3 className="ui-title text-lg text-amber-100">Legal and Attribution</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-200">
          <li>SKeyDB is an unofficial fan-made project and is not affiliated with Qookka Games.</li>
          <li>Morimens names, images, icons, and related game assets remain property of their respective owners.</li>
          <li>
            This page exists for community reference and planning transparency. If you are a rights holder and want
            adjustments, please reach out.
          </li>
        </ul>
      </article>
    </section>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="border border-amber-200/35 bg-slate-900/40 p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
      <h3 className="ui-title text-lg text-amber-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-200">{description}</p>
    </article>
  );
}

function RoadmapCard({ title, items }: { title: string; items: TaskItem[] }) {
  return (
    <article className="border border-slate-500/45 bg-slate-900/55 p-4">
      <h3 className="ui-title text-lg text-amber-100">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-200">
        {items.map((item) => (
          <li
            className="flex items-start justify-between gap-3"
            key={item.label}
          >
            <span>{item.label}</span>
            <span
              className={`shrink-0 rounded border bg-slate-900/70 px-2 py-0.5 text-xs ${statusClassName[item.status]}`}
            >
              {statusLabel[item.status]}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
