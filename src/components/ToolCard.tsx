import type { Tool } from '../types'

type ToolCardProps = {
  tool: Tool
  onClick: () => void
}

const ToolCard = ({ tool, onClick }: ToolCardProps) => {
  const Icon = tool.icon

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start gap-4 rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-100/50 dark:border-white/20 dark:bg-graphite dark:hover:border-white/30 dark:hover:shadow-none"
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600 transition-colors group-hover:bg-stone-200 dark:bg-ash dark:text-mist dark:group-hover:bg-white/10">
        <Icon size={24} weight="duotone" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="text-lg font-bold text-stone-900 dark:text-fog">
          {tool.name}
        </h3>
        <p className="text-sm text-stone-500 dark:text-mist">
          {tool.description}
        </p>
      </div>
      {tool.category && (
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 dark:bg-ash dark:text-mist">
          {tool.category}
        </span>
      )}
    </button>
  )
}

export default ToolCard
