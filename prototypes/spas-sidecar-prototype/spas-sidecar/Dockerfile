FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY index.js .
COPY transform.js .
CMD ["npm", "start"]
