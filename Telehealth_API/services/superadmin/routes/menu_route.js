"use strict";

import express from "express";
import { validationResult } from "express-validator";
import { authorizeRole, verifyToken } from "../helpers/verifyToken";
const menuController = require("../controllers/menus/menu");
const menuUserPermController = require("../controllers/menus/userMenu_permission");
import { menuValidator,editMenuValidator,permValidator,editPermValidator } from "../validator/menu";
const menuRoute = express.Router();

menuRoute.use(verifyToken);

menuRoute.post("/add-menu", authorizeRole(['superadmin']), menuValidator,
(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.json({
            status:false,
            message:'form validation message',
            error:errors.array()
        })
    }
    next();
},menuController.add_menu);
menuRoute.post("/edit-menu", authorizeRole(['superadmin']), editMenuValidator,(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.json({
            status:false,
            message:'form validation message',
            error:errors.array()
        })
    }
    next();
}, menuController.edit_menu);

menuRoute.get("/all-menus", menuController.all_menus);
menuRoute.get("/all-submenus", menuController.all_submenus);

menuRoute.post("/add-perm", authorizeRole(['superadmin']), permValidator,
(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.json({
            status:false,
            message:'form validation message',
            error:errors.array()
        })
    }
    next();
},menuController.add_perm);


menuRoute.put("/edit-perm", authorizeRole(['superadmin']), editPermValidator,(req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.json({
            status:false,
            message:'form validation message',
            error:errors.array()
        })
    }
    next();
}, menuController.edit_perm);

menuRoute.get("/all-perms", menuController.all_perms);
menuRoute.post("/add-user-menu", authorizeRole(['superadmin', "INDIVIDUAL", "INDIVIDUAL_DOCTOR", "pharmacy"]), menuUserPermController.add_user_menu);
menuRoute.get("/all-user-menu",menuUserPermController.all_user_menu);
menuRoute.post("/edit-user-menu", authorizeRole(['superadmin', "INDIVIDUAL", "INDIVIDUAL_DOCTOR", "pharmacy"]), menuUserPermController.edit_user_menu);
menuRoute.post('/add-submenu-permission', authorizeRole(['superadmin', "INDIVIDUAL", "INDIVIDUAL_DOCTOR", "pharmacy"]), menuUserPermController.addSubmenuPermission)
menuRoute.get('/get-submenu-by-user', menuUserPermController.getSubmenuByUser)

export default menuRoute;