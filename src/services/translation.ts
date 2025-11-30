const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY

export type LanguageCode = 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'ru' | 'ar' | 'pt' | 'it' | 'hi'

export const SUPPORTED_LANGUAGES: Array<{ code: LanguageCode; name: string }> = [
  { code: 'en', name: '英语' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'es', name: '西班牙语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'ru', name: '俄语' },
  { code: 'ar', name: '阿拉伯语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'it', name: '意大利语' },
  { code: 'hi', name: '印地语' },
]

export interface TranslationResult {
  text: string
  detectedLanguage?: string
}

export interface TranslationError {
  message: string
  code?: string
}

/**
 * 使用 Google Translate API 翻译文本
 */
export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode
): Promise<TranslationResult> {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('Google Translate API Key 未配置')
  }

  if (!text.trim()) {
    return { text: '' }
  }

  try {
    const url = new URL('https://translation.googleapis.com/language/translate/v2')
    url.searchParams.append('key', GOOGLE_TRANSLATE_API_KEY)
    url.searchParams.append('q', text)
    url.searchParams.append('target', targetLanguage)
    if (sourceLanguage) {
      url.searchParams.append('source', sourceLanguage)
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `翻译失败: ${response.statusText}`)
    }

    const data = await response.json()
    const translation = data.data?.translations?.[0]

    if (!translation) {
      throw new Error('翻译响应格式错误')
    }

    return {
      text: translation.translatedText || '',
      detectedLanguage: translation.detectedSourceLanguage,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('翻译过程中发生未知错误')
  }
}

/**
 * 批量翻译到多种目标语言
 */
export async function translateToMultipleLanguages(
  text: string,
  targetLanguages: LanguageCode[],
  sourceLanguage?: LanguageCode
): Promise<Record<LanguageCode, TranslationResult>> {
  const results: Record<string, TranslationResult> = {}

  // 并行翻译到所有目标语言
  const promises = targetLanguages.map(async lang => {
    try {
      const result = await translateText(text, lang, sourceLanguage)
      return { lang, result }
    } catch (error) {
      return {
        lang,
        result: {
          text: '',
          detectedLanguage: sourceLanguage,
        },
      }
    }
  })

  const settled = await Promise.all(promises)
  settled.forEach(({ lang, result }) => {
    results[lang] = result
  })

  return results as Record<LanguageCode, TranslationResult>
}
