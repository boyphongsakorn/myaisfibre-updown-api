FROM node:18-alpine
WORKDIR '/app'
RUN apk add --update ffmpeg
RUN npm install -g pnpm
COPY package*.json ./
COPY pnpm-*.yaml ./
RUN pnpm fetch --prod
ADD . ./
RUN pnpm install -r --offline --prod
#RUN npm install
#COPY . .
CMD ["node","index.js"]
