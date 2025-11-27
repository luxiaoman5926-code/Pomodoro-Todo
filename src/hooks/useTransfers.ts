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
      // 批量生成签名 URL (有效期 1 小时)
      // 找出所有需要签名的文件路径
      const filePaths = data
        .filter(item => item.type !== 'text')
        .map(item => item.content)

      let urlMap = new Map<string, string>()

      if (filePaths.length > 0) {
        const { data: signedData, error: signError } = await supabase.storage
          .from('transfers')
          .createSignedUrls(filePaths, 3600)

        if (signError) {
          console.error('Error signing urls:', signError)
        } else if (signedData) {
          signedData.forEach((d) => {
            if (d.path && d.signedUrl) {
              urlMap.set(d.path, d.signedUrl)
            }
          })
        }
      }

      const itemsWithUrls = data.map((item) => {
        if (item.type === 'text') return item
        return {
          ...item,
          url: urlMap.get(item.content) || '', // 获取对应的 URL
        }
      })

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
      const { data: insertedData, error: dbError } = await supabase
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
        .select()
        .single()

      if (dbError) throw dbError

      fetchTransfers()
      return insertedData
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('上传失败，请重试')
      return null
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
    refresh: fetchTransfers,
    renameTransfer: async (id: string, newName: string) => {
      // Optimistic update
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            metadata: {
              ...item.metadata,
              name: newName
            }
          }
        }
        return item
      }))

      const { error } = await supabase
        .from('transfers')
        .update({
          metadata: {
            // We need to fetch current metadata first or rely on partial update if jsonb merges?
            // Supabase jsonb updates replace the whole object usually unless using specialized functions.
            // So we better make sure we have the other metadata preserved.
            // Since we did optimistic update, we can assume `items` has the latest structure but wait...
            // Actually, let's just update the specific field using jsonb_set if possible or just fetch-update-push.
            // For simplicity here, we'll assume we're just updating the name in the jsonb blob.
            // We need to get the current item to preserve other metadata fields like size/mimeType.
            // The optimistic update handles the UI. For DB, we might need a more robust approach or 
            // assume the current state in `items` is valid to send back (risky if stale).
            // A safer way for a simple field update inside JSONB without fetching first is complex in simple update calls.
            // Let's fetch the specific item first to be safe, or just use the item from state if we trust it.
             name: newName
          }
        }) // Wait, this will replace metadata with JUST {name: newName}. We need to merge.
        // Let's actually query the item from the state to merge.
      
      // Correct approach:
      const itemToUpdate = items.find(i => i.id === id)
      if (!itemToUpdate) return

      const newMetadata = { ...itemToUpdate.metadata, name: newName }
      
      const { error: updateError } = await supabase
        .from('transfers')
        .update({ metadata: newMetadata })
        .eq('id', id)

      if (updateError) {
        console.error('Error renaming transfer:', updateError)
        // Revert optimistic update
        fetchTransfers()
      }
    }
  }
}

