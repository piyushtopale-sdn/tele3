import 'dotenv/config.js';
const config = {
    DB: {
      HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
      PORT: process.env.MONGO_DB_PORT || "58173",
      DATABASE: process.env.PHARMACY_MONGO_DATABASE || "pharmacy",
      USERNAME: process.env.PHARMACY_MONGO_USER || "pharmacy",
      PASSWORD: process.env.PHARMACY_MONGO_PASSWORD || "RJMtygb22sdfd",
    },
    PORTS: {
      API_PORT: process.env.PHARMACY_SERVICE_PORT || 8001,
    },
    secret: {
      JWT: process.env.JWT_SECRET || "",
    },
    JWT_EXPIRATION_IN_MINUTES: process.env.JWT_EXPIRATION_IN_MINUTES || 1440,
    NODE_ENV: process.env.NODE_ENV || "local",
  };
  
  module.exports.get = function get() {
    return config;
  };
  