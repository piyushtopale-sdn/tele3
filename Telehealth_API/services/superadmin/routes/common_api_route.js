"use strict";

import express from "express";
import commonDataController from "../controllers/common_data/commonDataController";
import { handleResponse } from "../middleware/utils";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
import fs from "fs";

const commonRoute = express.Router();
const uploadFileToLocalStorage = async (req, res, next) => {
    if (!req.files) {
        return handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "No files found",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
    
    const file = req.files.file;
    if (file.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        return handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Only excel file allowed!",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
    const filename = file.name.split('.')[0] + '-' + Date.now() + '.xlsx';
    req.filename = filename;
    const newPath = `${__dirname.replace('routes', 'uploads')}/${filename}`
    fs.writeFile(newPath, file.data, (err) => {
        if (err) {
            return handleResponse(req, res, 500, {
                status: false,
                body: err,
                message: "Something went wrong while uploading file",
                errorCode: "INTERNAL_SERVER_ERROR ",
            })
        }
        next()
    })
}

//Nationality
commonRoute.get('/nationality-list', commonDataController.getAllUsersNationality)


// Designation
commonRoute.post('/add-designation', commonDataController.addDesignation_SuperAdmin)
commonRoute.get('/list-designation', commonDataController.allDesignationList)
commonRoute.put('/update-designation', commonDataController.updateDesignation)
commonRoute.post('/delete-designation', commonDataController.actionOnDesignation)
commonRoute.get('/exportsheetlist-designation', commonDataController.allDesignatonListforexport)
commonRoute.post('/upload-csv-for-designation-list', uploadFileToLocalStorage, commonDataController.uploadCSVForDesignation)
commonRoute.get('/getById-designation', commonDataController.designationById)


// Language
commonRoute.post('/add-language', commonDataController.addLanguage_SuperAdmin)
commonRoute.get('/list-language', commonDataController.allLanguageList)
commonRoute.put('/update-language', commonDataController.updateLanguage)
commonRoute.post('/delete-language', commonDataController.actionOnLanguage)
commonRoute.get('/exportsheetlist-language', commonDataController.allLanguageListforexport)
commonRoute.post('/upload-csv-for-language-list', uploadFileToLocalStorage, commonDataController.uploadCSVForLanguage)

// Common list api's
commonRoute.get('/common-designationlist', commonDataController.commmonDesignationList)
commonRoute.get('/common-language', commonDataController.commmonLanguageList)

/* Bussiness Solution Form */
commonRoute.post("/add-bussiness-form",commonDataController.AddBusssinesSolutiondetails)
/**PT-07/10/2024 */
commonRoute.use(verifyToken);
commonRoute.post("/add-study-type", authorizeRole(['superadmin']), commonDataController.addStudyType);
commonRoute.get("/get-study-type", commonDataController.getStudyType);
commonRoute.put("/update-study-type", authorizeRole(['superadmin']), commonDataController.updateStudyType);
commonRoute.put("/delete-active-inactive-study-type", authorizeRole(['superadmin']), commonDataController.updateStudyTypeByAction);
commonRoute.get("/get-study-type-byId/:id", commonDataController.getStudyTypeById);
commonRoute.get('/exportsheetlist-studyType', authorizeRole(['superadmin']), commonDataController.allStudyTypeforexport)
commonRoute.post('/find-or-create', authorizeRole(['superadmin']), commonDataController.findOrCreateStudyType)




export default commonRoute;