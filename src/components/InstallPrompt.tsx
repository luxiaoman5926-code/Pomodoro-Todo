import { useEffect, useState } from 'react'
import { Plus, Share, X } from 'lucide-react'

const InstallPrompt = () => {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    // Check user agent
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isMobile = /iphone|ipad|ipod|android/.test(userAgent)

    if (isMobile) {
      setIsIOS(/iphone|ipad|ipod/.test(userAgent))
      // Show after a short delay
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl transition-all dark:border-white/10 dark:bg-[#1c1917] dark:text-white md:hidden">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold">添加到主屏幕</h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {isIOS
              ? '体验更佳，全屏沉浸式专注'
              : '安装应用，离线也能使用'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600 dark:bg-white/5 dark:text-stone-300">
        {isIOS ? (
          <div className="flex flex-wrap items-center gap-1">
            点击底部的
            <Share size={14} className="mx-0.5 inline" />
            分享按钮，然后向下滚动并选择
            <span className="font-bold">“添加到主屏幕”</span>
            <div className="inline-flex size-4 items-center justify-center rounded bg-stone-200 dark:bg-white/20">
              <Plus size={10} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            点击浏览器菜单（通常是右上角），选择
            <span className="font-bold">“安装应用”</span>
            或
            <span className="font-bold">“添加到主屏幕”</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstallPrompt

