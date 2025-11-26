import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import type { TransferItem, TransferType } from '../types'

export const useTransfers = (userId: string | null) => {
  const [items, setItems] = useState<TransferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // 获取列表
  const fetchTransfers = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching transfers:', error)
    } else if (data) {
      // 为文件生成签名 URL (有效期 1 小时)
      const itemsWithUrls = await Promise.all(
        data.map(async (item) => {
          if (item.type === 'text') return item
          
          // item.content 存储的是 storage path
          const { data: signedData } = await supabase.storage
            .from('transfers')
            .createSignedUrl(item.content, 3600)
            
          return {
            ...item,
            url: signedData?.signedUrl || '', // 临时 URL
          }
        })
      )
      setItems(itemsWithUrls as TransferItem[])
    }
    setLoading(false)
  }, [userId])

  // 发送文本
  const sendText = async (text: string) => {
    if (!userId || !text.trim()) return

    const { error } = await supabase
      .from('transfers')
      .insert({
        user_id: userId,
        type: 'text',
        content: text,
        metadata: {},
      })

    if (error) {
      console.error('Error sending text:', error)
    } else {
      fetchTransfers()
    }
  }

  // 上传文件
  const uploadFile = async (file: File) => {
    if (!userId) return

    setUploading(true)
    try {
      // 1. Determine type
      let type: TransferType = 'document'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type.startsWith('audio/')) type = 'audio'

      // 2. Upload to Storage
      // 处理文件名，避免特殊字符
      const fileName = file.name.replace(/[^\x00-\x7F]/g, '_')
      const filePath = `${userId}/${Date.now()}_${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('transfers')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 3. Insert into DB
      const { error: dbError } = await supabase
        .from('transfers')
        .insert({
          user_id: userId,
          type,
          content: filePath, // Store the path
          metadata: {
            name: file.name,
            size: file.size,
            mimeType: file.type,
          },
        })

      if (dbError) throw dbError

      fetchTransfers()
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  // 删除
  const deleteTransfer = async (id: string, content: string, type: TransferType) => {
    // 1. Delete from DB
    const { error: dbError } = await supabase
      .from('transfers')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Error deleting transfer:', dbError)
      return
    }

    // 2. Delete from Storage (if not text)
    if (type !== 'text') {
      const { error: storageError } = await supabase.storage
        .from('transfers')
        .remove([content])
      
      if (storageError) {
        console.error('Error deleting file:', storageError)
      }
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  return {
    items,
    loading,
    uploading,
    sendText,
    uploadFile,
    deleteTransfer,
    refresh: fetchTransfers
  }
}

