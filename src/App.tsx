import Timer from './components/Timer'
import TodoList from './components/TodoList'

const App = () => (
  <div className="min-h-screen bg-gradient-to-b from-coal via-black to-graphite px-4 py-10">
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-[40px] border border-white/5 bg-[#050505]/80 p-6 text-white shadow-depth backdrop-blur-2xl md:p-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.45em] text-white/50">
          深度专注
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <h1 className="text-4xl font-semibold md:text-5xl">
            番茄钟待办工作台
          </h1>
          <p className="text-sm text-white/60">
            25 分钟冲刺 · 5 分钟休息 · 循环推进高效的一天
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <Timer />
        <TodoList />
      </section>
    </main>
  </div>
)

export default App
