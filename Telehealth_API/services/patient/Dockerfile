FROM node:18.20.3-alpine
RUN mkdir -p /var/www/patient/
COPY package*.json ./var/www/patient/
WORKDIR /var/www/patient/
RUN npm install -g npm@10.7.0 nodemon
RUN npm install
ENV PATH /var/www/patient/node_modules/.bin:$PATH
COPY . .
EXPOSE ${PORT}
CMD ["npm", "run", "server"]