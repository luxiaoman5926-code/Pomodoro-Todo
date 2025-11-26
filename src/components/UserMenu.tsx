import { useState, useRef, useEffect } from 'react'
import { SignOut, User as UserIcon, CaretDown } from '@phosphor-icons/react'
import type { User } from '@supabase/supabase-js'

type UserMenuProps = {
  user: User
  onSignOut: () => Promise<void>
}

const UserMenu = ({ user, onSignOut }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await onSignOut()
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  // 获取用户显示名称
  const displayName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.email?.split('@')[0] || 
                      '用户'

  // 获取用户头像
  const avatarUrl = user.user_metadata?.avatar_url || 
                    user.user_metadata?.picture

  return (
    <div className="relative" ref={menuRef}>
      {/* 用户按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-white/10"
      >
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-7 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <UserIcon className="size-4 text-white" />
          </div>
        )}
        <span className="max-w-[100px] truncate text-sm font-medium text-stone-700 dark:text-white">
          {displayName}
        </span>
        <CaretDown weight="bold" className={`size-4 text-stone-400 transition-transform duration-200 dark:text-white/50 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-stone-200/50 bg-white shadow-xl shadow-stone-900/10 dark:border-white/5 dark:bg-coal dark:shadow-black/20">
          {/* 用户信息 */}
          <div className="border-b border-stone-100 p-4 dark:border-white/5">
            <p className="truncate font-semibold text-stone-900 dark:text-white">
              {displayName}
            </p>
            {user.email && (
              <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-white/50">
                {user.email}
              </p>
            )}
          </div>

          {/* 菜单项 */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-50 dark:text-white/70 dark:hover:bg-white/5"
            >
              <SignOut size={16} weight="duotone" />
              <span>{isLoading ? '退出中...' : '退出登录'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu

