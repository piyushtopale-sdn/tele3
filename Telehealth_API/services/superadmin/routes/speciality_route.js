"use strict";

import express from "express";
import SpecialityController from "../controllers/speciality/specialityController";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const specialityRoute = express.Router();

specialityRoute.get('/speciality-list',  SpecialityController.list)
specialityRoute.use(verifyToken);
//For Hospital
specialityRoute.post('/add', authorizeRole(['superadmin']), SpecialityController.create)
specialityRoute.post('/update', authorizeRole(['superadmin']), SpecialityController.update)
specialityRoute.post('/action', authorizeRole(['superadmin']), SpecialityController.delete)

export default specialityRoute;