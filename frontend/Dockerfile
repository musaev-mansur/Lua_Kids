# Frontend Dockerfile для Next.js
FROM node:20-alpine AS base

# Устанавливаем зависимости только при необходимости
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем package files
COPY package*.json ./
RUN npm ci

# Собираем приложение
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Копируем файлы проекта (исключая node_modules через .dockerignore)
COPY package.json ./
COPY tsconfig.json ./
COPY next.config.mjs ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY styles ./styles
COPY types ./types

# Отключаем telemetry во время сборки
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем Next.js приложение
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем собранные файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запускаем Next.js сервер
CMD ["npm", "start"]

