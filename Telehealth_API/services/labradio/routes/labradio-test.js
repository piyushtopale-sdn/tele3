"use strict";

import express from "express";
import { addRadioTest, deleteRadioTest, editRadioTest, getRadioTestByCenter, listRadioTest } from "../controllers/labRadioTest.controller";
import { verifyToken } from "../helpers/verifyToken";
const labRadioTestRoute = express.Router();

labRadioTestRoute.use(verifyToken)

// Radiology Test
labRadioTestRoute.post("/add-radio-test", addRadioTest);
labRadioTestRoute.put("/edit-radio-test", editRadioTest);
labRadioTestRoute.get("/get-all-radio-test", listRadioTest);
labRadioTestRoute.get("/get-radiotest-by-center", getRadioTestByCenter);
labRadioTestRoute.delete("/delete-radio-test", deleteRadioTest);

export default labRadioTestRoute;