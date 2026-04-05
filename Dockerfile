# syntax=docker/dockerfile:1.4
# Optimized Dockerfile for Next.js with pnpm and standalone output

# =====================
# Base stage for shared configs
# =====================
FROM node:20-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@9.15.0

# =====================
# Dependencies
# =====================
FROM base AS deps

ENV PNPM_STORE_PATH=/pnpm/store

COPY package.json pnpm-lock.yaml ./

RUN pnpm config set registry https://registry.npmmirror.com

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
# Install dependencies based on the preferred package manager
# =====================
# Build
# =====================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm build

# =====================
# Runtime
# ===================== 
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create a non-root user for security
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Set the correct permissions for nextjs user
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy necessary files from builder
# Automatically leverages the standalone output from next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]