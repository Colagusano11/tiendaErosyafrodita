# Etapa de build
FROM node:18-alpine AS build
WORKDIR /app

# Dependencias
COPY package*.json ./
RUN npm ci          # mejor que npm install para Docker

# Código del frontend
COPY . .
ARG VITE_API_URL
ARG VITE_GA_ID
ARG VITE_PAYPAL_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GA_ID=$VITE_GA_ID
ENV VITE_PAYPAL_CLIENT_ID=$VITE_PAYPAL_CLIENT_ID
RUN npm run build   # genera /app/dist

# Etapa de producción con Nginx
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf

# Copiamos el build de Vite (dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Config Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
