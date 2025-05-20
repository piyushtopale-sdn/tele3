import Role from "../../models/rolesandpermission/role_model";
import roleCounter from "../../models/rolesandpermission/role_counter_model";
// utils
import { sendResponse } from "../../helpers/transmission";
import PortalUser from "../../models/portal_user";

let seqId=0;
const add_role = async (req, res) => {
    roleCounter.findOneAndUpdate(
        {id:"autoval"},
        {"$inc":{"seq":1}},
        {new:true},
        async (err,cd)=>{
            
            if(cd==null){
                const newval = new roleCounter({id:"autoval",seq:1})
                newval.save();
                seqId = 1;
            }else{
                seqId = cd.seq;
            }

            try{
                const { rolesArray, for_user,type } = req.body
                const list = rolesArray.map((singleData) => ({
                    ...singleData,
                    for_user,
                    role_id: seqId, // Assign seqId to role_id
                    type,
                }));
                const namesToFind = list.map((item) => item.name);
                const foundItems = await Role.find({
                    name: { $in: namesToFind },
                    for_user: for_user,
                    is_delete:'No'
                });
                const CheckData = foundItems.map((item) => item.name);
                if (foundItems.length === 0) {
                    const savedRole = await Role.insertMany(list)
                    sendResponse(req, res, 200, {
                        status: true,
                        body: savedRole,
                        message: "Successfully add Role",
                        errorCode: null,
                    });
                } else {
                    sendResponse(req, res, 200, {
                        status: false,
                        message: `${CheckData} is already exist`,
                        errorCode: null,
                    });
                }
               }catch(error){
                console.error("An error occurred:", error);
                sendResponse(req, res, 500, {
                  status: false,
                  body: null,
                  message: "failed to add Role",
                  errorCode: "INTERNAL_SERVER_ERROR",
                });
               }

        }
    )
        
    
}

const all_role = async (req, res) => {
    try {
        let { limit, page, userId, type } = req.query;
        const checkUser = await PortalUser.findOne({_id:userId});
        if (checkUser?.role === 'STAFF') {
            const data = await PortalUser.findOne({ created_by_user: checkUser?.created_by_user });
            userId = data?.created_by_user;
        }
        let sort = req.query.sort
        let sortingarray = {};
        if (sort != 'undefined' && sort != '' && sort != undefined)  {
            let keynew = sort.split(":")[0];
            let value = sort.split(":")[1];
            sortingarray[keynew] = value;
        } else {
            sortingarray['createdAt'] = -1;
        }
        let filter = { for_user: userId, is_delete: "No", type:type }; // Update the filter to include 'is_delete: "No"'
        let roles = '';
        if (limit == undefined) {
            limit = 0;
        }
        if (page == undefined) {
            page = 1;
        }
        if (limit == 0) {
            roles = await Role.find(filter)
                .sort(sortingarray)
                .exec();
        }
        else {
            roles = await Role.find(filter)
                .sort(sortingarray)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();
        }
        const count = await Role.countDocuments(filter); // Count only the documents that match the filter

        sendResponse(req, res, 200, {
            status: true,
            body: {
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalCount: count,
                data: roles,
            },
            message: "Successfully fetched all roles",
            errorCode: null,
        })
    } catch (error) {
        console.error("An error occurred:", error);
        sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Failed to fetch roles",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
    }

}

const update_role = async(req,res)=>{
    //
    try {
        const role = {
            name: req.body.name,
            status: req.body.status,
            is_delete:req.body.is_delete,
            type: req.body.type
        };
        const updatedRole = await Role.findByIdAndUpdate(
          { _id: req.body.id , type: req.body.type},
          role,
          { upsert: false, new: true }
        );
        sendResponse(req, res, 200, {
            status: true,
            body: updatedRole,
            message: "Successfully updated role",
            errorCode: null,
        })
      } catch (error) {
        console.error("An error occurred:", error);
        sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to update role",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
      }
}

const delete_role = async(req,res)=>{
    //
    try {
        const role = {
            is_delete:req.body.is_delete,
            type: req.body.type,
        };
        await Role.findByIdAndUpdate(
          { _id: req.body.id, type: req.body.type, },
          role,
          { upsert: false, new: true }
        );
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Successfully deleted role",
            errorCode: null,
        })
      } catch (error) {
        console.error("An error occurred:", error);
        sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "failed to delete role",
            errorCode: "INTERNAL_SERVER_ERROR",
        })
      }
}


module.exports = {
    add_role,
    all_role,
    update_role,
    delete_role
}
