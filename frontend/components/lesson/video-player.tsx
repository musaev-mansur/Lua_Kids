"use client"

import { useState, useEffect } from "react"

interface VideoPlayerProps {
  url?: string
  poster?: string
}

/**
 * Преобразует различные форматы YouTube URL в embed формат
 */
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null

  // Если уже embed URL, возвращаем как есть
  if (url.includes('youtube.com/embed/')) {
    return url
  }

  // Извлекаем video ID из различных форматов YouTube URL
  let videoId: string | null = null

  // Формат: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  if (watchMatch) {
    videoId = watchMatch[1]
  }

  // Формат: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^&\n?#]+)/)
  if (shortMatch) {
    videoId = shortMatch[1]
  }

  // Если не удалось извлечь video ID, возвращаем null
  if (!videoId) {
    return null
  }

  // Возвращаем embed URL
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
}

export function VideoPlayer({ url, poster }: VideoPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (url) {
      const embed = getYouTubeEmbedUrl(url)
      setEmbedUrl(embed)
      setIsLoading(false)
    } else {
      setEmbedUrl(null)
      setIsLoading(false)
    }
  }, [url])

  if (!url || !embedUrl) {
    return null
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">Загрузка видео...</div>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      )}
    </div>
  )
}
