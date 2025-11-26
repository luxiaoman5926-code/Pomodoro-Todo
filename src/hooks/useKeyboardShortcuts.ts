import { useEffect } from 'react'

type KeyboardShortcut = {
  key: string
  altKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  callback: () => void
  description?: string
}

type UseKeyboardShortcutsOptions = {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

/**
 * useKeyboardShortcuts hook 用于处理全局键盘快捷键
 * 支持组合键（Alt、Ctrl、Shift、Meta）
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果用户正在输入（在 input、textarea 等元素中），不触发快捷键
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // 但允许某些全局快捷键（如 Alt+N）
        if (!event.altKey && !event.ctrlKey && !event.metaKey) {
          return
        }
      }

      // 检查每个快捷键
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey
        const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
        const metaMatch = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey

        if (keyMatch && altMatch && ctrlMatch && shiftMatch && metaMatch) {
          event.preventDefault()
          shortcut.callback()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

/**
 * 格式化快捷键显示文本
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = []

  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.metaKey) parts.push('Cmd')

  // 格式化按键名称
  const keyName =
    shortcut.key.length === 1
      ? shortcut.key.toUpperCase()
      : shortcut.key === ' '
      ? 'Space'
      : shortcut.key

  parts.push(keyName)

  return parts.join(' + ')
}

