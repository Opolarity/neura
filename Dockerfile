# Build: 2026-02-03
# 1) Build (Node)
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json .npmrc ./
# NPM_TOKEN: token de lectura de GitHub Packages (@opolarity/rum). Build Variable en Coolify.
ARG NPM_TOKEN
RUN NPM_TOKEN=$NPM_TOKEN npm ci

COPY . .
# RUM: variables de build (Coolify las pasa como build-args) y release (SOURCE_COMMIT).
ARG VITE_RUM_ENDPOINT
ARG VITE_RUM_KEY
ARG VITE_RUM_ENV
ARG SOURCE_COMMIT
ENV VITE_RUM_ENDPOINT=$VITE_RUM_ENDPOINT \
    VITE_RUM_KEY=$VITE_RUM_KEY \
    VITE_RUM_ENV=$VITE_RUM_ENV \
    VITE_RUM_RELEASE=$SOURCE_COMMIT

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
