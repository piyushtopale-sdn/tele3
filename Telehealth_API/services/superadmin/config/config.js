import 'dotenv/config.js';
const config = {
  DB: {
    HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
    PORT: process.env.MONGO_DB_PORT || "58173",
    DATABASE: process.env.SUPERADMIN_MONGO_DATABASE || "superadmin",
    USERNAME: process.env.SUPERADMIN_MONGO_USER || "superadmin",
    PASSWORD: process.env.SUPERADMIN_MONGO_PASSWORD || "RJMtygb22sdfd",
  },
  PORTS: {
    API_PORT: process.env.SUPERADMIN_SERVICE_PORT || 8006,
  },
  secret: {
    JWT: process.env.JWT_SECRET || "",
  },
  JWT_EXPIRATION_IN_MINUTES: process.env.JWT_EXPIRATION_IN_MINUTES || 1440,
};

module.exports.get = function get() {
  return config;
};
