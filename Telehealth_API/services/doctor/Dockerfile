FROM node:18.20.3-alpine
RUN mkdir -p /var/www/doctor/
COPY package*.json ./var/www/doctor/
WORKDIR /var/www/doctor
RUN npm install -g npm@6.14.7 nodemon
RUN npm install
ENV PATH /var/www/doctor/node_modules/.bin:$PATH
COPY . .
EXPOSE ${PORT}
CMD ["npm", "run", "server"]