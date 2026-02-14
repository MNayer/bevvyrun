FROM node:latest

COPY app /app/
WORKDIR /app/

RUN npm install && npm run build

CMD ["npm", "run", "start:server"]
