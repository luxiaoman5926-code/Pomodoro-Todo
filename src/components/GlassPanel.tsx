import type { ReactNode } from 'react'

type GlassPanelProps = {
  label: string
  title: string
  meta?: ReactNode
  metaClassName?: string
  className?: string
  children: ReactNode
}

const baseClassName =
  'flex flex-col gap-6 rounded-[32px] border border-white/5 p-6 backdrop-blur-xl shadow-depth'

const GlassPanel = ({
  label,
  title,
  meta,
  metaClassName = 'text-sm text-white/60',
  className = '',
  children,
}: GlassPanelProps) => (
  <section className={`${baseClassName} ${className}`.trim()}>
    <header className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          {label}
        </p>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>
      {meta ? <span className={metaClassName}>{meta}</span> : null}
    </header>
    {children}
  </section>
)

export default GlassPanel

