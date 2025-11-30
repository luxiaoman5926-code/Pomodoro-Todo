import { useState, useCallback, useMemo } from 'react'
import { Translate, Copy, Check } from '@phosphor-icons/react'
import { translateToMultipleLanguages, SUPPORTED_LANGUAGES, type LanguageCode } from '../../services/translation'
import type { ToolProps } from '../../types'

const TranslationTool = ({}: ToolProps) => {
  const GOOGLE_TRANSLATE_API_KEY = useMemo(() => import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY, [])
  const [sourceText, setSourceText] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode | ''>('')
  const [targetLanguages, setTargetLanguages] = useState<LanguageCode[]>(['en', 'ja', 'ko'])
  const [translations, setTranslations] = useState<Record<LanguageCode, string>>({} as Record<LanguageCode, string>)
  const [isTranslating, setIsTranslating] = useState(false)
  const [copiedLang, setCopiedLang] = useState<LanguageCode | null>(null)
  const [history, setHistory] = useState<Array<{ source: string; translations: Record<LanguageCode, string> }>>([])

  // 翻译处理
  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || !GOOGLE_TRANSLATE_API_KEY) return

    setIsTranslating(true)
    try {
      const results = await translateToMultipleLanguages(
        sourceText,
        targetLanguages,
        sourceLanguage || undefined
      )

      const translationMap: Record<LanguageCode, string> = {} as Record<LanguageCode, string>
      Object.entries(results).forEach(([lang, result]) => {
        translationMap[lang as LanguageCode] = result.text
      })
      setTranslations(translationMap)

      // 添加到历史记录
      setHistory(prev => [{ source: sourceText, translations: translationMap }, ...prev].slice(0, 10))
    } catch (error) {
      console.error('Translation error:', error)
      alert(error instanceof Error ? error.message : '翻译失败，请检查API配置')
    } finally {
      setIsTranslating(false)
    }
  }, [sourceText, sourceLanguage, targetLanguages, GOOGLE_TRANSLATE_API_KEY])

  // 复制翻译结果
  const handleCopy = async (text: string, lang: LanguageCode) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLang(lang)
      setTimeout(() => setCopiedLang(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  // 切换目标语言
  const toggleTargetLanguage = (lang: LanguageCode) => {
    setTargetLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  return (
    <div className="p-6">
      {/* API密钥提示 */}
      {!GOOGLE_TRANSLATE_API_KEY && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            请配置 Google Translate API Key 以使用翻译功能。在环境变量中设置 <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-500/20">VITE_GOOGLE_TRANSLATE_API_KEY</code>
          </p>
        </div>
      )}

      {/* 源语言输入 */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-fog">
          原文
        </label>
        <div className="flex gap-3">
          <select
            value={sourceLanguage}
            onChange={e => setSourceLanguage(e.target.value as LanguageCode | '')}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/20 dark:bg-ash dark:text-fog"
          >
            <option value="">自动检测</option>
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <textarea
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder="输入要翻译的文本..."
            rows={4}
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-white/20 dark:bg-ash dark:text-fog dark:placeholder:text-mist"
          />
          <button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isTranslating || !GOOGLE_TRANSLATE_API_KEY}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Translate size={18} weight="bold" />
            {isTranslating ? '翻译中...' : '翻译'}
          </button>
        </div>
      </div>

      {/* 目标语言选择 */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-fog">
          目标语言
        </label>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => toggleTargetLanguage(lang.code)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                targetLanguages.includes(lang.code)
                  ? 'bg-amber-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-ash dark:text-mist dark:hover:bg-white/10'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* 翻译结果 */}
      {Object.keys(translations).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-700 dark:text-fog">翻译结果</h3>
          {targetLanguages
            .filter(lang => translations[lang])
            .map(lang => {
              const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang)
              const translatedText = translations[lang]
              return (
                <div
                  key={lang}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-white/20 dark:bg-ash"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-600 dark:text-mist">
                      {langInfo?.name}
                    </span>
                    <button
                      onClick={() => handleCopy(translatedText, lang)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700 dark:text-mist dark:hover:bg-white/10 dark:hover:text-fog"
                    >
                      {copiedLang === lang ? (
                        <>
                          <Check size={14} weight="bold" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-stone-900 dark:text-fog">{translatedText}</p>
                </div>
              )
            })}
        </div>
      )}

      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="mt-8 border-t border-stone-200 pt-6 dark:border-white/20">
          <h3 className="mb-4 text-sm font-medium text-stone-700 dark:text-fog">历史记录</h3>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-stone-200 bg-white p-4 dark:border-white/20 dark:bg-graphite"
              >
                <p className="mb-2 text-sm text-stone-600 dark:text-mist">{item.source}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(item.translations).map(([lang, text]) => {
                    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang)
                    return (
                      <span
                        key={lang}
                        className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-600 dark:bg-ash dark:text-mist"
                      >
                        {langInfo?.name}: {text}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TranslationTool
