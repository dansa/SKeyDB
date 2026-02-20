export function HomePage() {
  return (
    <section className="space-y-4">
      <h2 className="ui-title text-2xl text-amber-100 md:text-3xl">Starter Overview</h2>
      <p className="max-w-3xl text-slate-200">
        This project is ready for character data, ownership tracking, team building rules, and share links.
        The visual style is intentionally lightweight but aligned with the in-game dark and gold tone.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard
          description="JSON-first source for characters/wheels, validated with Zod."
          title="Content Pipeline"
        />
        <InfoCard
          description="React Router pages for Overview, Characters, and Builder."
          title="App Structure"
        />
        <InfoCard
          description="Ready to add Zustand stores and unit assignment rules."
          title="Next Feature"
        />
      </div>
    </section>
  )
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="border border-amber-200/35 bg-slate-900/40 p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]">
      <h3 className="ui-title text-lg text-amber-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-200">{description}</p>
    </article>
  )
}
