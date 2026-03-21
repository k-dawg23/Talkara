# Node 22.x satisfies Astro 6: ^20.19.1 || >=22.12.0
# (Railway Nixpacks often picked Node 18 / ignored NIXPACKS_NODE_VERSION.)
FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]
