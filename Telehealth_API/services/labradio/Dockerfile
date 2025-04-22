FROM node:18.20.3-alpine
RUN mkdir -p /var/www/labradio/
COPY package*.json ./var/www/labradio/
WORKDIR /var/www/labradio
RUN npm install -g npm@10.7.0 nodemon
RUN npm install
ENV PATH /var/www/labradio/node_modules/.bin:$PATH
COPY . .
EXPOSE ${PORT}
CMD ["npm", "run", "server"]