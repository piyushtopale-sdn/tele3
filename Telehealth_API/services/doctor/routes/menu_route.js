"use strict";

import express from "express";
import { validationResult } from "express-validator";
import menuController from "../controllers/menus/menu.js";
import menuUserPermController from "../controllers/menus/userMenu_permission.js";
import { menuValidator,editMenuValidator,permValidator,editPermValidator } from "../validator/menu";
const menuRoute = express.Router();

menuRoute.post("/add-menu",menuValidator,
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
menuRoute.post("/edit-menu",editMenuValidator,(req,res,next)=>{
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

menuRoute.post("/add-perm",permValidator,
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


menuRoute.put("/edit-perm",editPermValidator,(req,res,next)=>{
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
menuRoute.post("/add-user-menu",menuUserPermController.add_user_menu);
menuRoute.get("/all-user-menu",menuUserPermController.all_user_menu);
menuRoute.post("/edit-user-menu",menuUserPermController.edit_user_menu);
menuRoute.post('/add-submenu-permission', menuUserPermController.addSubmenuPermission)
menuRoute.get('/get-submenu-by-user', menuUserPermController.getSubmenuByUser)

export default menuRoute;