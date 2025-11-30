import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Для Docker
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Настраиваем alias для путей @/*
    const basePath = path.resolve(__dirname)
    
    if (!config.resolve) {
      config.resolve = {}
    }
    
    if (!config.resolve.alias) {
      config.resolve.alias = {}
    }
    
    // Явно указываем alias для @
    config.resolve.alias['@'] = basePath
    
    // Убеждаемся что модули разрешаются правильно
    if (!config.resolve.modules) {
      config.resolve.modules = []
    }
    if (Array.isArray(config.resolve.modules)) {
      config.resolve.modules.push(basePath)
    }
    
    // Добавляем расширения для разрешения
    if (!config.resolve.extensions) {
      config.resolve.extensions = []
    }
    if (!config.resolve.extensions.includes('.ts')) {
      config.resolve.extensions.push('.ts', '.tsx', '.js', '.jsx')
    }
    
    // Игнорируем Node.js модули для fengari в браузере
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        // НЕ добавляем tmp и readline-sync: false, так как мы заменяем их на заглушки
      }
      
      config.resolve.alias['tmp'] = path.resolve(__dirname, 'lib/tmp-stub.js')
      config.resolve.alias['readline-sync'] = path.resolve(__dirname, 'lib/readline-sync-stub.js')
      
      // Игнорируем проблемные модули, которые используются в fengari
      config.plugins = config.plugins || []
      
      // Заменяем tmp модуль на заглушку
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^tmp$/,
          path.resolve(__dirname, 'lib/tmp-stub.js')
        )
      )
      
      // Заменяем readline-sync модуль на заглушку
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^readline-sync$/,
          path.resolve(__dirname, 'lib/readline-sync-stub.js')
        )
      )
    }
    return config
  },
}

export default nextConfig
