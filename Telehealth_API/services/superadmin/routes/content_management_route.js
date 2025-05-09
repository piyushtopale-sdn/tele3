"use strict";

import express from "express";
import contentManagementController from "../controllers/contentManagement/contentManagementController";
import { verifyToken } from "../helpers/verifyToken";
const contentManagementRoute = express.Router();
//FAQ
contentManagementRoute.get('/all-faq', contentManagementController.allFAQ)
contentManagementRoute.post('/add-faq', contentManagementController.addFAQ)
contentManagementRoute.put("/update-faq-question/:faqId/:questionId",contentManagementController.updateFAQ)


//Privacy and Condition
contentManagementRoute.post('/edit-privacy-condition-en', contentManagementController.editPrivacyConditionEn)
// contentManagementRoute.get('/get-privacy-condition-en', contentManagementController.getPrivacyConditionEn)
contentManagementRoute.post('/edit-privacy-condition-fr', contentManagementController.editPrivacyConditionFr)
// contentManagementRoute.get('/get-privacy-condition-fr', contentManagementController.getPrivacyConditionFr)

contentManagementRoute.get('/get-privacy-condition', contentManagementController.getPrivacyCondition)


//Terms and Condition
contentManagementRoute.post('/edit-terms-condition-en', contentManagementController.editTermsConditionEn)
// contentManagementRoute.get('/get-terms-condition-en', contentManagementController.getTermsConditionEn)
contentManagementRoute.post('/edit-terms-condition-fr', contentManagementController.editTermsConditionFr)
// contentManagementRoute.get('/get-terms-condition-fr', contentManagementController.getTermsConditionFr)

contentManagementRoute.get('/get-terms-condition', contentManagementController.getTermsCondition)

//CRUD For Content
contentManagementRoute.post('/send-notification',verifyToken, contentManagementController.sendNotification)

export default contentManagementRoute;