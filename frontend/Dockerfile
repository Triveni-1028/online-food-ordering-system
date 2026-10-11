
FROM node:24-alpine
RUN apk upgrade --no-cache

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8001
CMD ["node","server.js"]
