import mongoose from "mongoose";

const menuPermissionSchema = new mongoose.Schema({    
    menu_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menus"
    },
    role_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
    },
    menu_order: {
        type: Number,
        default: ''
    },
    permission_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permissions"
    },
    parent_id: {
        type: String,
        default: ""
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });


export default mongoose.model("menu_permissions", menuPermissionSchema);