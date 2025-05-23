import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import DB from "./db/db.js";
import { roleRoute,  pharmacyRoute, orderRoute } from "./routes/index";
const session = require('express-session');
const fileUpload = require('express-fileupload');

const app = express();

DB()
//middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
const _dirname = path.resolve();
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static(path.join(_dirname, "public")));
app.use(session({
    secret: 'pharmacy',
    resave: false,
    saveUninitialized: true
}))

app.use((err, req, res, next) => {
    console.log("Error @ app ", err);
    next(err);
});

// Routes
app.use("/", express.static("public"));
app.use("/role", roleRoute);
app.use("/order", orderRoute);
app.use("/pharmacy", pharmacyRoute);

export default app;
