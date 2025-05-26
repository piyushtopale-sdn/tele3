import 'dotenv/config.js';
const config = {
    DB: {
        HOST: process.env.MONGO_DB_HOST || "54.201.160.69",
        PORT: process.env.MONGO_DB_PORT || "58173",
        DATABASE: process.env.PATIENT_MONGO_DATABASE || "",
        USERNAME: process.env.PATIENT_MONGO_USER || "",
        PASSWORD: process.env.PATIENT_MONGO_PASSWORD || "PLKJMsd234",
    },
    PORTS: {
        API_PORT: process.env.PATIENT_SERVICE_PORT || 8007,
    },
    secret: {
        JWT: process.env.JWT_SECRET || "",
    },
    JWT_EXPIRATION_IN_MINUTES: process.env.JWT_EXPIRATION_IN_MINUTES || 1440,
    test_p_FRONTEND_URL: process.env.test_p_FRONTEND_URL || "http://44.211.113.36:9248",
};

module.exports.get = function get() {
    return config;
};
