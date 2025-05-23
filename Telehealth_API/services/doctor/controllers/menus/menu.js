import Menus from "../../models/rolesandpermission/menu_model";
import Permission from "../../models/rolesandpermission/permission_model";
import { handleResponse } from "../../helpers/transmission";

const add_menu = async (req, res) => {


    const addMenu = new Menus({
        name: req.body.name,
        description: req.body.description,
        menu_order: req.body.menu_order,
        url: req.body.url,
        slug: req.body.slug,
        parent_id: req.body.parent_id
    });
    try {
        await addMenu.save((err) => {
            if (err) {
                handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: "failed to add menu",
                    errorCode: "INTERNAL_SERVER_ERROR",
                })
            }
            handleResponse(req, res, 200, {
                status: true,
                body: null,
                message: "Menu Added successfully",
                errorCode: null,
            })
        });

    } catch (error) {
        console.error("An error occurred:", error);
        handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to add menu",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }

}

const all_menus = async (req, res) => {
    try {
        const menus = await Menus.find({ status: { $eq: 1 } }).sort({ 'menu_order': 1 });
        handleResponse(req, res, 200, {
            status: true,
            body: menus,
            message: "fetched all menus",
            errorCode: null,
        })
    } catch (error) {
        console.error("An error occurred:", error);
        handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Failed to fetch all menus",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }

}

const edit_menu = async (req, res) => {
    try {
        const menu = {
            name: req.body.name,
            description: req.body.description,
            menu_order: req.body.menu_order,
            url: req.body.url,
            slug: req.body.slug
        };
        await Menus.findByIdAndUpdate(
            { _id: req.body.id },
            menu
        ).then(() => handleResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Menu updated successfully",
            errorCode: null,
        })).catch(() => handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to edit menu",
            errorCode: "INTERNAL_SERVER_ERROR",
        }));

    } catch (error) {
        res.json({ message: error });
    }
}

const delete_menu = async (req, res) => {
    try {
        const role = {
            is_delete: req.body.is_delete
        };
        const updatedRole = await Menus.findByIdAndUpdate(
            { _id: req.body.id },
            role
        );
        res.json(updatedRole);
    } catch (error) {
        res.json({ message: error });
    }
}


const add_perm = async (req, res) => {
    const addPerm = new Permission({
        menu_id: req.body.menu_id,
        perm_name: req.body.perm_name,
        perm_order:req.body.perm_order
    });
    try {
        await addPerm.save((err) => {
            if (err) {
                handleResponse(req, res, 500, {
                    status: false,
                    body: null,
                    message: "failed to add permission",
                    errorCode: "INTERNAL_SERVER_ERROR",
                })
            }
            handleResponse(req, res, 200, {
                status: true,
                body: null,
                message: "successfully added permission",
                errorCode: null,
            })
        });

    } catch (error) {
        console.error("An error occurred:", error);
        handleResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to add permission",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }

}

const all_perms = async (req, res) => {
    try {
        const perms = await Permission.find({ status: { $eq: 1 } }).sort({ '_id': 1 });
        res.json(perms);
    } catch (error) {
        res.json({ message: error });
    }

}


const edit_perm = async (req, res) => {
    try {
        const menu = {
            menu_id: req.body.menu_id,
            perm_name: req.body.perm_name,
            status: req.body.perm_name,
            perm_order:req.body.perm_order
        };
        await Menus.findByIdAndUpdate(
            { _id: req.body.id },
            menu
        ).then(() => res.json({
            status: true,
            message: "Data updated"
        })).catch((err) => res.status(500).send({ message: err }));

    } catch (error) {
        res.json({ message: error });
    }
}





module.exports = {
    add_menu,
    edit_menu,
    all_menus,
    add_perm,
    all_perms,
    edit_perm,
    delete_menu
}
