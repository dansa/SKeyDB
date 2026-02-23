import { useState } from "react";
import { FaDiscord, FaGithub } from "react-icons/fa6";
import emojiAel from "../assets/emoji/Emoji_AEL_E_05.png";
import emojiPdyM09 from "../assets/emoji/Emoji_PDY_M_09.png";
import { changelogItems } from "./home/changelog";

type TaskStatus = "planned" | "in_progress" | "done" | "forever_in_progress";

type TaskItem = {
  label: string;
  status: TaskStatus;
};

const builderTasks: TaskItem[] = [
  { label: "Local storage persistence", status: "done" },
  { label: "Collection (owned/unowned)", status: "done" },
  { label: "Mobile-first builder layout", status: "planned" },
  { label: "Quick Select flow for faster selection", status: "planned" },
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
          className="h-12 w-12 self-start object-cover"
          src={emojiAel}
        />
        <div className="min-w-0">
          <div className="space-y-1 text-sm text-slate-300">
            <h3 className="ui-title text-lg text-amber-100">Community project for Morimens data and team planning tools.</h3>
            <p>
              Hello friends, I am just a guy.. and old.. and running out of codex credits.. but I have a lot of free time ~
            </p>
            <p>
              I am trying to make something useful for the community with the help of a few people over in Mythag University!
            </p>
            <a
              className="text-link inline-flex items-center gap-1.5"
              href="https://discord.gg/b3T723SUJU"
            >
              <FaDiscord aria-hidden className="text-base text-slate-300" />
              <span>Join Mythag University!</span>
            </a>
            <ul className="space-y-1 pt-1">
              <li className="flex items-center gap-1.5">
                <FaGithub aria-hidden className="text-base text-slate-300" />
                <span>GitHub:</span>
                <a className="text-link" href="https://github.com/dansa/SKeyDB">
                  @SKeyDB
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <FaDiscord aria-hidden className="text-base text-slate-300" />
                <span>Project contact:</span>
                <a className="text-link" href="https://discord.com/users/fjantsa">
                  @Fjant (fjantsa)
                </a>
              </li>
              <li className="text-slate-400">
                DMs open for questions, issues, angry messages, and mild existential debugging.
              </li>
            </ul>
          </div>
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

      <article className="border border-slate-500/45 bg-slate-900/55 p-4">
        <h3 className="ui-title text-lg text-amber-100">Attribution and Legal</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-200">
          <li>
            Awakener avatars/cards and posse images used in this project are currently sourced from{" "}
            <a className="text-link" href="https://morimens.huijiwiki.com/p/1">
              Morimens HuijiWiki
            </a>
            .
          </li>
          <li>
            HuijiWiki content for these assets is credited under{" "}
            <a className="text-link" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
              CC BY-NC-SA
            </a>
          </li>
          <li>Big thanks to the Huiji contributors for putting those resources together, it helped us get going a lot quicker than we would have otherwise</li>
          <li>
            And apologies for not adding this contribution notice sooner~
            <img
              alt=""
              aria-hidden
              className="ml-1 inline-block h-12 w-12 -scale-x-100 object-contain"
              src={emojiPdyM09}
            />
          </li>
          <li aria-hidden className="py-1">
            <span className="block h-px w-48 bg-gradient-to-r from-amber-200/45 via-slate-300/35 to-transparent" />
          </li>
          <li>SKeyDB is an unofficial fan project and is not affiliated with Qookka Games.</li>
          <li>
            Morimens names, images, icons, and related game assets belong to Qookka Games and/or their licensors.
          </li>
          <li>If you are a rights holder and want anything adjusted or removed, please reach out.</li>
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
