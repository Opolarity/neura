# Build: 2026-02-03
# 1) Build (Node)
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2) Serve (Nginx)
FROM nginx:alpine

# Zona horaria del negocio. En esta imagen el ERP es un SPA estatico —la hora
# que ve el usuario la pone su navegador— asi que esto no cambia lo que se
# pinta: es para que los logs de nginx y cualquier cron o script que se meta
# aca hablen en hora de Lima y no en UTC. En alpine `TZ` sin `tzdata` se
# ignora en silencio y se queda en UTC, por eso el apk add.
RUN apk add --no-cache tzdata
ENV TZ=America/Lima
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
