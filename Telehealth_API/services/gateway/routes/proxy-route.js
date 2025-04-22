import 'dotenv/config.js';
const ROUTES = [
    {
        url: "/pharmacy-service",
        auth: false,
        creditCheck: false,
        // rateLimit: {
        //     windowMs: 15 * 60 * 1000,
        //     max: 300,
        // },
        proxy: {
            target: process.env.PHARMACY_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                [`^/pharmacy-service`]: "",
            },
        },
    },
    {
        url: "/superadmin-service",
        auth: false,
        creditCheck: false,
        // rateLimit: {
        //     windowMs: 15 * 60 * 1000,
        //     max: 300,
        // },
        proxy: {
            target: process.env.SUPERADMIN_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                [`^/superadmin-service`]: "",
            },
        },
    },
    {
        url: "/patient-service",
        auth: false,
        creditCheck: false,
        // rateLimit: {
        //     windowMs: 15 * 60 * 1000,
        //     max: 300,
        // },
        proxy: {
            target: process.env.PATIENT_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                [`^/patient-service`]: "",
            },
        },
    },
    {
        url: "/labradio-service",
        auth: false,
        creditCheck: false,
        // rateLimit: {
        //     windowMs: 15 * 60 * 1000,
        //     max: 300,
        // },
        proxy: {
            target: process.env.LABRADIO_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                [`^/labradio-service`]: "",
            },
        },
    },
    {
        url: "/doctor-service",
        auth: false,
        creditCheck: false,
        // rateLimit: {
        //     windowMs: 15 * 60 * 1000,
        //     max: 300,
        // },
        proxy: {
            target: process.env.DOCTOR_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                [`^/doctor-service`]: "",
            },
        },
    },
];

export const proxyRoute = ROUTES;
