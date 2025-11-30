import { useEffect, useRef } from 'react'
import { X } from '@phosphor-icons/react'
import type { Tool } from '../types'

type ToolModalProps = {
  tool: Tool | null
  isOpen: boolean
  onClose: () => void
}

const ToolModal = ({ tool, isOpen, onClose }: ToolModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !tool) return null

  const ToolComponent = tool.component

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-white/20 dark:bg-graphite"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4 dark:border-white/20 dark:bg-ash">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white text-stone-600 dark:bg-graphite dark:text-mist">
              <tool.icon size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-fog">
                {tool.name}
              </h2>
              {tool.category && (
                <p className="text-xs text-stone-500 dark:text-mist">
                  {tool.category}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 dark:text-mist dark:hover:bg-white/10 dark:hover:text-fog"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)' }}>
          <ToolComponent toolId={tool.id} />
        </div>
      </div>
    </div>
  )
}

export default ToolModal
