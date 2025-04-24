import mongoose from "mongoose";
import NotificationManagement from "../../models/superadmin/notification-management"
import { sendResponse } from "../../helpers/transmission";

export const addNotification = async (req, res) => {
    try {
        const { notification_title, notification_type, condition, content, content_arabic } = req.body;

        const getNotification = await NotificationManagement.find({condition,notification_type, is_deleted: false})
        if (getNotification.length > 0) {
            return sendResponse(req, res, 200, {
                status: true,
                body: null,
                message: `Notification already exist with same condition and notification type`,
                errorCode: null,
            });
        }
        
        const addObject = new NotificationManagement({
            notification_title,
            created_by: req?.user?._id,
            content,
            content_arabic,
            condition,
            notification_type,
        });

        await addObject.save();

        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Notification added successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.error("An error occurred:", error);
        return sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Failed to add notification.",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const editNotification = async (req, res) => {
    try {
        const { id, notification_title, notification_type, condition, content, content_arabic } = req.body;

        const getNotification = await NotificationManagement.find({condition,notification_type, is_deleted: false, _id: {$ne: id}})
        if (getNotification.length > 0) {
            return sendResponse(req, res, 200, {
                status: true,
                body: null,
                message: `Notification already exist with same condition and notification type`,
                errorCode: null,
            });
        }
        
        await NotificationManagement.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    notification_title,
                    notification_type,
                    condition,
                    content,
                    content_arabic,
                }
            }
        )
        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Notification updated successfully.",
            errorCode: null,
        });
    } catch (error) {
        console.error("An error occurred:", error);
        return sendResponse(req, res, 500, {
            status: false,
            body: null,
            message: "Failed to edit notification.",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getNotificationList = async (req, res) => {
    try {
        const { limit, page, searchText, type } = req.query;

        let search_filter = [{}]
        if (searchText) {
            search_filter = [
                { notification_title: {$regex: searchText || '', $options: "i"} }
            ]
        }

        let type_filter = {}
        if (type !== 'all') {
            type_filter['notification_type'] = type
        }

        const pipeline = [
            {
                $match: {
                    is_deleted: false,
                    $or: search_filter,
                    $and: [
                        type_filter
                    ]
                }
            },
            {
                $group: {
                    _id: "$_id",
                    notification_title: { $first: "$notification_title"},
                    notification_type: { $first: "$notification_type"},
                    condition: { $first: "$condition"},
                    createdAt: { $first: "$createdAt"}
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $facet: {
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ],
                    paginatedResults: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit * 1}
                    ]
                }
            }
        ]
       
        const result = await NotificationManagement.aggregate(pipeline)

        let totalCount = 0
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count
        }

        return sendResponse(req, res, 200, {
            status: true,
            body: {
                data: result[0]?.paginatedResults,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                totalRecords: totalCount,
            },
            message: "List fetched successfully",
        });

    } catch (err) {
        return sendResponse(req, res, 500, {
            status: false,
            body: err,
            message: "Internal server error",
        });
    }
}

export const getNotificationById = async (req, res) => {
    try {
        const { _id } = req.query;
        const result = await NotificationManagement.findOne({ _id: mongoose.Types.ObjectId(_id) })

        return sendResponse(req, res, 200, {
            status: true,
            data: result,
            message: `Notification Fetch successfully`,
            errorCode: null,
        })

    } catch (err) {
        
        return sendResponse(req, res, 500, {
            status: false,
            data: err,
            message: `Failed to fetch list`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const getNotificationByCondition = async (req, res) => {
    try {
        const { condition, type } = req.query;
        let filter = { condition, is_deleted: false}
        if (type) {
            filter.notification_type = type
        }
        const result = await NotificationManagement.find(filter)

        return sendResponse(req, res, 200, {
            status: true,
            data: result,
            message: `Notification Fetch successfully`,
            errorCode: null,
        })

    } catch (err) {
        
        return sendResponse(req, res, 500, {
            status: false,
            data: err,
            message: `Failed to fetch list`,
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    }
}

export const deleteNotification = async (req, res) => {
    try{
       const {_id} = req.body;
       const result = await NotificationManagement.findByIdAndUpdate(_id, { $set: {is_deleted:true} }, { new: true });

       if(result){
        return sendResponse(req, res, 200, {
            status: true,
            data: null,
            message: `Notification Deleted successfully`,
            errorCode: null,
        })
       }else{
        return sendResponse(req, res, 400, {
            status: true,
            data: [],
            message: `Notification Not Deleted`,
            errorCode: null,
        })
       }
    } catch (err) {
        return sendResponse(req, res, 500, {
            status: false,
            body: err,
            message: "Internal server error",
        });
    }
}