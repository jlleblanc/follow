import { useState, useEffect, useRef } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { addWebsite } from '../services/database'

interface CommandBarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWebsiteAdded?: () => void
}

export function CommandBar({ open, onOpenChange, onWebsiteAdded }: CommandBarProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  const normalizeUrl = (input: string): string => {
    let normalized = input.trim()
    
    // If no protocol specified, assume https://
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized
    }
    
    return normalized
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || loading) return

    try {
      setLoading(true)
      const normalizedUrl = normalizeUrl(url)
      console.log('Adding website:', normalizedUrl)
      await addWebsite(normalizedUrl)
      console.log('Website added successfully')
      setUrl('')
      onOpenChange(false)
      onWebsiteAdded?.()
    } catch (error) {
      console.error('Failed to add website:', error)
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Failed to add website: ${errorMessage}\n\nPlease check the URL and try again.`)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL to follow..."
              className="flex-1 bg-transparent outline-none placeholder:text-gray-400"
              autoComplete="off"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </form>
        
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> to add • <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}
