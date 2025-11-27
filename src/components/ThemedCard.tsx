import type { ReactNode } from 'react'

type ThemedCardProps = {
  label: string
  title: string
  meta: string | ReactNode
  children: ReactNode
  className?: string
}

const ThemedCard = ({
  label,
  title,
  meta,
  children,
  className = '',
}: ThemedCardProps) => (
  <div
    className={`flex min-h-[500px] flex-col justify-between rounded-[2rem] border border-stone-100 bg-white p-8 shadow-card transition-colors duration-300 dark:border-white/5 dark:bg-graphite dark:shadow-depth dark:backdrop-blur-2xl ${className}`}
  >
    <div className="mb-6 flex items-center justify-between">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-mist">
          {label}
        </span>
        <h2 className="text-2xl font-bold text-stone-800 dark:text-fog">
          {title}
        </h2>
      </div>
      <span className="text-sm font-medium text-stone-400 dark:text-mist">
        {meta}
      </span>
    </div>

    {children}
  </div>
)

export default ThemedCard
