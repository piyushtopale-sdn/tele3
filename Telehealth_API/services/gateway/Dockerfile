FROM node:18.20.3-alpine
RUN mkdir -p /var/www/gateway/
COPY package*.json ./var/www/gateway/
WORKDIR /var/www/gateway
RUN npm install -g npm@10.7.0 nodemon
RUN npm install
ENV PATH /var/www/gateway/node_modules/.bin:$PATH
COPY . .
EXPOSE ${PORT}
CMD ["npm", "run", "server"]