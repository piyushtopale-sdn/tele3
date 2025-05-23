import MenuPermission from "../../models/rolesandpermission/menu_permission";
import PortalUser from "../../models/superadmin/portal_user";
import { handleResponse } from "../../helpers/transmission";
import mongoose from "mongoose";

const add_user_menu = async (req, res) => {
    const { menu_array, children_array } = req.body
    let menusArray = []
    await MenuPermission.deleteMany({ user_id: req.body.user_id })
    for (const menuID in menu_array) {
        menusArray.push({
            menu_id: menuID,
            role_id: null,
            permission_id: null,
            user_id: req.body.user_id,
            menu_order: menu_array[menuID]
        })
        if (menuID.toString() in children_array) {
            for (const childMenu of children_array[menuID]) {
                menusArray.push({
                    menu_id: childMenu,
                    role_id: null,
                    permission_id: null,
                    user_id: req.body.user_id,
                    menu_order: menu_array[menuID],
                    parent_id: menuID
                })
            }
        }
    }
    try {
        const result = await MenuPermission.insertMany(menusArray)
        if (result) {
            handleResponse(req, res, 200, {
                status: true,
                body: result,
                message: "Permission Added successfully",
                errorCode: null,
            })
        } else {
            handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to add permission to user",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        }

    } catch (error) {
        console.error("An error occurred:", error);
        handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to add permission to user",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }

}

const all_user_menu = async (req, res) => {
    try {
        const perms = await MenuPermission.find({ user_id: req.query.user_id }).sort({ menu_order: 1 })
            .populate({
                path: 'role_id'
            })
            .populate({
                path: 'menu_id'
            })
            .populate({
                path: 'permission_id'
            });
        handleResponse(req, res, 200, {
            status: true,
            body: perms,
            message: "successfully fetched user menu",
            errorCode: null,
        })
    } catch (error) {
        console.error("An error occurred:", error);
        handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Failed to fetch user menu",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }

}

const edit_user_menu = async (req, res) => {
    try {
        const menu = {
            menu_id: req.body.menu_id,
            role_id: req.body.role_id,
            permission_id: req.body.permission_id
        };
        await MenuPermission.findByIdAndUpdate(
            { _id: req.body.id },
            menu
        ).then(() => handleResponse(req, res, 200, {
            status: true,
            body: null,
            message: "successfully data updated",
            errorCode: null,
        })).catch(() => {
            
            handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to update data",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        });

    } catch (error) {
        console.error("An error occurred:", error);
        handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to update data",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
}

const addSubmenuPermission = async (req, res) => {
    try {
        const { portal_user_id, permission_data } = req.body
        const permissionObject = {
            permissions: permission_data,
        };
        await PortalUser.findOneAndUpdate(
            { superadmin_id: mongoose.Types.ObjectId(portal_user_id) },
            permissionObject
        ).then(() => handleResponse(req, res, 200, {
            status: true,
            body: permissionObject,
            message: "successfully data updated",
            errorCode: null,
        })).catch(() => {
            
            handleResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to update data",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        });

    } catch (error) {
        console.error("An error occurred:", error);
        handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to update data",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
}

const getSubmenuByUser = async (req, res) => {
    try {
        const { user_id } = req.query
        const userPermission = await PortalUser.findOne({ superadmin_id: user_id }).select('permissions').exec()
        handleResponse(req, res, 200, {
            status: true,
            body: {
                user_permissions: userPermission
            },
            message: "successfully fetched permissions",
            errorCode: null,
        })
    } catch (error) {
        console.error("An error occurred:", error);
        handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to update data",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
}

module.exports = {
    add_user_menu,
    edit_user_menu,
    all_user_menu,
    addSubmenuPermission,
    getSubmenuByUser
}
