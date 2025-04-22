"use strict";

import express from "express";
import { verifyToken } from "../helpers/verifyToken";
const hospitalRoute = express.Router();

hospitalRoute.use(verifyToken);

export default hospitalRoute;