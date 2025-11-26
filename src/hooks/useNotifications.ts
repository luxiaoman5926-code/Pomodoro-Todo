import { useEffect, useRef } from 'react'

type NotificationOptions = {
  title: string
  body: string
  icon?: string
  tag?: string
}

/**
 * useNotifications hook 用于管理桌面通知
 * 自动请求权限并在阶段完成时发送通知
 */
export const useNotifications = () => {
  const permissionRef = useRef<NotificationPermission>('default')

  // 请求通知权限
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification')
      return false
    }

    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted'
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      permissionRef.current = permission
      return permission === 'granted'
    }

    return false
  }

  // 发送通知
  const sendNotification = async (options: NotificationOptions) => {
    if (!('Notification' in window)) {
      return
    }

    // 如果还没有权限，先请求
    if (permissionRef.current !== 'granted') {
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        return
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/vite.svg',
        tag: options.tag || 'pomodoro',
        badge: '/vite.svg',
        requireInteraction: false,
      })

      // 自动关闭通知（5秒后）
      setTimeout(() => {
        notification.close()
      }, 5000)

      // 点击通知时聚焦窗口
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  // 初始化时请求权限（如果浏览器支持）
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // 不自动请求，等用户第一次完成番茄钟时再请求
      // 这样用户体验更好
    }
  }, [])

  return {
    requestPermission,
    sendNotification,
    hasPermission: permissionRef.current === 'granted' || Notification.permission === 'granted',
  }
}

