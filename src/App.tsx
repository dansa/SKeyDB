import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BuilderPage } from './pages/BuilderPage'
import { CharactersPage } from './pages/CharactersPage'
import { HomePage } from './pages/HomePage'

function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f3148,_#0c121c_60%)] text-slate-100">
      <header className="border-b border-amber-200/30 bg-slate-950/35 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="ui-title text-2xl text-amber-100 md:text-3xl">SKeyDB</h1>
            <p className="text-sm text-slate-300">Morimens Team Builder</p>
          </div>
          <nav className="flex items-center gap-2 text-sm md:text-base">
            <NavLink className={navClassName} to="/">
              Overview
            </NavLink>
            <NavLink className={navClassName} to="/characters">
              Characters
            </NavLink>
            <NavLink className={navClassName} to="/builder">
              Builder
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<CharactersPage />} path="/characters" />
          <Route element={<BuilderPage />} path="/builder" />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </main>
    </div>
  )
}

function navClassName({ isActive }: { isActive: boolean }) {
  const base =
    'border px-3 py-1.5 transition-colors duration-150 border-slate-500/40 hover:border-amber-200/50 hover:bg-slate-900/45'
  return isActive
    ? `${base} border-amber-200/70 bg-slate-900/60 text-amber-100`
    : `${base} text-slate-100`
}

export default App
