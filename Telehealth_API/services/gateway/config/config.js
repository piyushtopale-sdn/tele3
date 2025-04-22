import 'dotenv/config.js';
const config = {
  PORTS: {
    API_PORT: process.env.API_GATEWAY_PORT || 8005,
  },
  BASEURL: {
    labradioServiceUrl: process.env.LABRADIO_SERVICE_URL,
    doctorServiceUrl: process.env.DOCTOR_SERVICE_URL,
    superadminServiceUrl: process.env.SUPERADMIN_SERVICE_URL,
    patientServiceUrl: process.env.PATIENT_SERVICE_URL,
    pharmacyServiceUrl: process.env.PHARMACY_SERVICE_URL,
  },
};

module.exports.get = function get() {
    return config;
};
