import { sendResponse } from "../../helpers/transmission";
import VitalsThreshold from "../../models/vitalsthreshold";

export const addVitalsThreshold = async (req, res) => {
    try {
        const { vitalsType, rangeData } = req.body
        const existVital = await VitalsThreshold.findOne({ vitalsType: vitalsType , isDeleted: false});

        if (existVital) {
            return sendResponse(req, res, 200, {
            status: false,
            body: null,
            message: "Vitals already exist for the specified type",
            errorCode: null,
            })
        }
        for (const ele of rangeData) {
            if (vitalsType === "BLOOD_PRESSURE") {
                //Get records for BP systolic
                const getSystolicData = await VitalsThreshold.findOne({
                    vitalsType,
                    'BPSystolic.gender': ele?.BPSystolic?.gender,
                    'BPSystolic.age': ele?.BPSystolic?.age
                })
                //Get records for BP Diastolic
                const getDiastolicData = await VitalsThreshold.findOne({
                    vitalsType,
                    'BPDiastolic.gender': ele?.BPDiastolic?.gender,
                    'BPDiastolic.age': ele?.BPDiastolic?.age
                })
                if (!getSystolicData && !getDiastolicData) {
                    const addObject = {
                        vitalsType,
                        BPSystolic: ele?.BPSystolic,
                        BPDiastolic: ele?.BPDiastolic,
                    }
                    const addData = new VitalsThreshold(addObject)
                    await addData.save()
                }
            } else {
                const getData = await VitalsThreshold.findOne({
                    vitalsType,
                    gender: ele?.gender,
                    age: ele?.age
                })
                if (!getData) {
                    const addObject = {
                        vitalsType,
                        gender: ele.gender,
                        age: ele.age,
                        high: ele.high,
                        low: ele.low,
                        criticalHigh: ele.criticalHigh,
                        criticalLow: ele.criticalLow,
                        unit: ele.unit,
                    }
                    const addData = new VitalsThreshold(addObject)
                    await addData.save()
                }
            }
        }

        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Vitals threshold added successfully",
            errorCode: null,
        })
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const getVitalsThreshold = async (req, res) => {
    try {
        const { page, limit, searchText, status, fromDate, toDate } = req.query

        let search_filter = [{}]
        if (searchText) {
            search_filter = [
                { vitalsType: {$regex: searchText || '', $options: "i"} }
            ]
        }
        let date_filter = {}
        if(fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            date_filter = {
                createdAt: { $gte: fromDateObj, $lte: toDateObj }
            }
          }

        let match = {
            isDeleted: false,
            $or: search_filter,
            $and: [
                date_filter
            ]
        }
        if (status && status != 'all') {
            match.status = status
        }

        const pipeline = [
            {
                $match: match
            },
            {
                $group: {
                    _id: "$_id",
                    vitalsType: { $first: "$vitalsType"},
                    BPSystolic: { $first: "$BPSystolic"},
                    BPDiastolic: { $first: "$BPDiastolic"},
                    gender: { $first: "$gender"},
                    age: { $first: "$age"},
                    high: { $first: "$high"},
                    low: { $first: "$low"},
                    criticalHigh: { $first: "$criticalHigh"},
                    criticalLow: { $first: "$criticalLow"},
                    unit: { $first: "$unit"},
                    status: { $first: "$status"},
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
                    ]
                }
            }
        ]
        if (limit != 0) {
            pipeline[pipeline.length - 1]['$facet']['paginatedResults'] = [
                { $skip: (page - 1) * limit },
                { $limit: limit * 1}
            ]
        } else {
            pipeline[pipeline.length - 1]['$facet']['paginatedResults'] = []
        }

        const result = await VitalsThreshold.aggregate(pipeline)
        let totalCount = 0
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count
        }


        sendResponse(req, res, 200, {
            status: true,
            message: "Vitals threshold fetched successfully",
            body: {
                totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
                currentPage: page,
                totalRecords: totalCount,
                result: result[0].paginatedResults
            },
            errorCode: null,
        })
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const getVitalsThresholdById = async (req, res) => {
    try {
        const { id } = req.params

        const result = await VitalsThreshold.findById(id)

        sendResponse(req, res, 200, {
            status: true,
            message: "Vitals threshold fetched successfully",
            body: result,
            errorCode: null,
        })
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const updateVitalsThreshold = async (req, res) => {
    try {
        const { id, vitalsType, rangeData } = req.body
        let isExist = false;
        let getData;
        for (const ele of rangeData) {
            if (vitalsType === "BLOOD_PRESSURE") {
                //Get records for BP systolic
               await VitalsThreshold.findOne({
                    vitalsType,
                    'BPSystolic.gender': ele?.BPSystolic?.gender,
                    'BPSystolic.age': ele?.BPSystolic?.age,
                    _id: { $ne: id }
                })
                //Get records for BP Diastolic
               await VitalsThreshold.findOne({
                    vitalsType,
                    'BPDiastolic.gender': ele?.BPDiastolic?.gender,
                    'BPDiastolic.age': ele?.BPDiastolic?.age,
                    _id: { $ne: id }
                })
                if (getData) {
                    isExist = true
                    break
                }
                await VitalsThreshold.findOneAndUpdate(
                    { _id: id },
                    {
                        $set: {
                            vitalsType,
                            BPSystolic: ele?.BPSystolic,
                            BPDiastolic: ele?.BPDiastolic,
                        }
                    }
                )
            } else {
                const getData = await VitalsThreshold.findOne({
                    vitalsType,
                    gender: ele?.gender,
                    age: ele?.age,
                    _id: { $ne: id }
                })
                if (getData) {
                    isExist = true
                    break;
                }
                const updateObject = {
                    vitalsType,
                    gender: ele.gender,
                    age: ele.age,
                    high: ele.high,
                    low: ele.low,
                    criticalHigh: ele.criticalHigh,
                    criticalLow: ele.criticalLow,
                    unit: ele.unit,
                }
                await VitalsThreshold.findOneAndUpdate(
                    { _id: id },
                    {
                        $set: updateObject
                    }
                )
            }
        }

        if (isExist) {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: "Vitals threshold already exist with same vitals type and age successfully",
                errorCode: null,
            })
        }

        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: "Vitals threshold updated successfully",
            errorCode: null,
        })
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const updateVitalsThresholdByAction = async (req, res) => {
    try {
        const { id, actionName, actionValue } = req.body

       await VitalsThreshold.findOneAndUpdate(
        {
            _id: id,
        },
        {
            $set: {
                [actionName]: actionValue
            }
        }
       )
        sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: `Vitals threshold ${actionName == 'isDeleted' ? 'deleted' : 'updated'} successfully`,
            errorCode: null,
        })
    } catch (error) {
        sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}
