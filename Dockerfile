FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run test

RUN npm run build

EXPOSE 80

ENTRYPOINT [ "node", "dist/index.js" ]
