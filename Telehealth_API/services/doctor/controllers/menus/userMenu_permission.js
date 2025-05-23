import MenuPermission from "../../models/rolesandpermission/menu_permission";
import PortalUser from "../../models/portal_user";
import { sendResponse } from "../../helpers/transmission";


const add_user_menu = async (req, res) => {


    const addUserMenu = new MenuPermission({
        menu_id: req.body.menu_id,
        role_id: req.body.role_id,
        permission_id: req.body.permission_id,
        user_id: req.body.user_id
    });
    try {
        await addUserMenu.save((err) => {
            if (err) {
                sendResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: "failed to add permission to user",
                    errorCode: "INTERNAL_SERVER_ERROR",
                })
            }
            sendResponse(req, res, 200, {
                status: true,
                body: null,
                message: "Permission Added successfully",
                errorCode: null,
            })
        });

    } catch (error) {
        console.error("An error occurred:", error);
        sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to add permission to user",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }

}

const all_user_menu = async (req, res) => {
    try {
        const perms = await MenuPermission.find({})
                      .populate({
                        path: 'role_id'
                      })
                      .populate({
                        path: 'menu_id'
                      })
                      .populate({
                        path: 'permission_id'
                      });
        sendResponse(req, res, 200, {
            status: true,
            body: perms,
            message: "successfully fetched user menu",
            errorCode: null,
        })
    } catch (error) {
        console.error("An error occurred:", error);
        sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Failed to fetch user menu",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }

}


const edit_user_menu = async (req, res) => {
    //
    try {
        const menu = {
            menu_id: req.body.menu_id,
            role_id: req.body.role_id,
            permission_id: req.body.permission_id,
            user_id: req.body.user_id
        };
        await MenuPermission.findByIdAndUpdate(
            { _id: req.body.id },
            menu
        ).then(() => sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "successfully data updated",
            errorCode: null,
        })).catch(() => {
            
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to update data",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        });

    } catch (error) {
        console.error("An error occurred:", error);
        sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to update data",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
}

const addSubmenuPermission = async (req, res) => {
    //
    try {
        const { portal_user_id, permission_data } = req.body
        const permissionObject = {
            permissions: permission_data,
        };
        await PortalUser.findByIdAndUpdate(
            { _id: portal_user_id },
            permissionObject
        ).then(() => sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "successfully data updated",
            errorCode: null,
        })).catch(() => {
            
            sendResponse(req, res, 500, {
                status: false,
                body: null,
                message: "failed to update data",
                errorCode: "INTERNAL_SERVER_ERROR",
            })
        });

    } catch (error) {
        console.error("An error occurred:", error);
        sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to update data",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }
}

const getSubmenuByUser = async (req, res) => {
    //
    try {
        const { user_id } = req.query
        const result = await PortalUser.findById(user_id).select('permissions').exec();

        return sendResponse(req, res, 200, {
            status: true,
            body: {
                user_permissions: result
            },
            message: "successfully fetched permissions",
            errorCode: null,
        })

    } catch (error) {
        console.error("An error occurred:", error);
        sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Failed to fetch permission data",
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
