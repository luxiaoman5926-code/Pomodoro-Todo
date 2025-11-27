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
    className={`flex min-h-[460px] flex-col justify-between rounded-3xl border border-stone-100 bg-white p-5 md:p-6 shadow-xl shadow-stone-200/50 transition-all duration-300 dark:border-white/5 dark:bg-stone-900 dark:shadow-none ${className}`}
  >
    <div className="mb-6 flex items-center justify-between">
      <div>
        <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {label}
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-stone-800 dark:text-stone-100">
          {title}
        </h2>
      </div>
      <div className="text-sm font-medium text-stone-500 dark:text-stone-400">
        {meta}
      </div>
    </div>

    {children}
  </div>
)

export default ThemedCard
