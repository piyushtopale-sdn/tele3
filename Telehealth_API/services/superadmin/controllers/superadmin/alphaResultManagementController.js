import { sendResponse } from "../../helpers/transmission";
import AlphaResult from "../../models/alpharesult";

export const addAlphaResult = async (req, res) => {
    try {
        const { data } = req.body

        let alreadyExist = []
        for (const ele of data) {
          const getData = await AlphaResult.findOne({
                alphaResultName: ele.alphaResultName, 
                isDeleted: false
            })
            if (getData) {
                alreadyExist.push(ele.alphaResultName)
            } else {
                const addData = new AlphaResult(ele)
                await addData.save()
            }
        }
        let message = "Alpha results added successfully"
        if (alreadyExist.length > 0 && alreadyExist.length == data.length) {
            message = `This ${alreadyExist.join(", ")} alpha result has already been added`
        } else if (alreadyExist.length > 0 &&  alreadyExist.length != data.length) {
            message = `This ${alreadyExist.join(", ")} alpha result has already been added, remaining are added successfully`
        }


        return sendResponse(req, res, 200, {
            status: true,
            message,
            body: null,
            errorCode: null,
        })
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const getAlphaResult = async (req, res) => {
    try {
        const { page, limit, searchText, status, sort, fromDate, toDate } = req.query

        let search_filter = [{}]
        if (searchText) {
            search_filter = [
                { alphaResultName: {$regex: searchText || '', $options: "i"} }
            ]
        }

        let match = {
            isDeleted: false,
            $or: search_filter
        }
        if (status && status != 'all') {
            match.status = status
        }

        let fieldName = 'createdAt'
        let sortOrder = '-1'
        if (sort) {
            fieldName = sort.split(':')[0]
            sortOrder = sort.split(':')[1]
        }
        if(fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            match['$and'] = [{
              createdAt: { $gte: fromDateObj, $lte: toDateObj }
            }]
        }

        const pipeline = [
            {
                $match: match
            },
            {
                $group: {
                    _id: "$_id",
                    alphaResultName: { $first: "$alphaResultName"},
                    alphaResultNameArabic: { $first: "$alphaResultNameArabic"},
                    isMarkedAsCritical: { $first: "$isMarkedAsCritical"},
                    status: { $first: "$status"},
                    createdAt: { $first: "$createdAt"}
                }
            },
            {
                $sort: {
                    [fieldName]: parseInt(sortOrder)
                }
            },
            {
                $facet: {
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ],
                    paginatedResults: limit != 0 ? [
                        { $skip: (page - 1) * limit },
                        { $limit: limit * 1}
                    ] : [ { $skip: 0 } ]

                }
            }
        ]

        const result = await AlphaResult.aggregate(pipeline)
        let totalCount = 0
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count
        }


        return sendResponse(req, res, 200, {
            status: true,
            message: "Alpha result fetched successfully",
            body: {
                totalPages: limit != 0 ? Math.ceil(totalCount / limit) : 1,
                currentPage: page,
                totalRecords: totalCount,
                result: result[0].paginatedResults
            },
            errorCode: null,
        })
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const updateAlphaResult = async (req, res) => {
    try {
        const { id, alphaResultName, alphaResultNameArabic, isMarkedAsCritical, status } = req.body

        const getData = await AlphaResult.find({ alphaResultName, isDeleted: false, _id: {$ne: id} })

        if (getData.length > 0) {
            return sendResponse(req, res, 400, {
                status: false,
                message: "Alpha result already exist",
                body: null,
                errorCode: null,
            })
        }


       await AlphaResult.findOneAndUpdate(
        {
            _id: id,
        },
        {
            $set: {
                alphaResultName,
                alphaResultNameArabic,
                isMarkedAsCritical,
                status
            }
        }
       )
       return sendResponse(req, res, 200, {
            status: true,
            message: `Alpha result updated successfully`,
            body: null,
            errorCode: null,
        })
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const updateAlphaResultByAction = async (req, res) => {
    try {
        const { id, ids, actionName, actionValue } = req.body

        if (actionName === 'isDeleted' && ids.length > 0) {
            await AlphaResult.updateMany(
                {
                    _id: {$in: ids},
                },
                {
                    $set: {
                        [actionName]: true
                    }
                }
            )
        } else if (actionName === 'status' && id) {
            await AlphaResult.findOneAndUpdate(
                {
                    _id: id,
                },
                {
                    $set: {
                        [actionName]: actionValue
                    }
                }
            )
        } else {
            return sendResponse(req, res, 200, {
                status: false,
                body: null,
                message: `Please provide ${actionName == 'isDeleted' ? 'ids array' : 'id'}`,
                errorCode: null,
            })
        }

        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: `Alpha result ${actionName == 'isDeleted' ? 'deleted' : 'updated'} successfully`,
            errorCode: null,
        })
    } catch (error) {
        return sendResponse(req, res, 500, {
            status: false,
            body: error,
            message: "Internal server error",
            errorCode: null,
        });
    }
}

export const allAlphaResultforexport = async (req, res) => {
    const { searchText, limit, page } = req.query
    let filter
    if (searchText == "") {
      filter = {
        isDeleted: false
      }
    } else {
      filter = {
        isDeleted: false,
        team: { $regex: searchText || '', $options: "i" },
      }
    }
    try {
      let result = '';
      if (limit > 0) {
        result = await AlphaResult.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      else {
        result = await AlphaResult.aggregate([{
          $match: filter
        },
        { $sort: { "createdAt": -1 } },
        {
          $project: {
            _id: 0,
            alphaResultName: "$alphaResultName"
          }
        }
        ])
      }
      let array = result.map(obj => Object.values(obj));
      return sendResponse(req, res, 200, {
        status: true,
        data: {
          result,
          array
        },
        message: `Data exported successfully`,
        errorCode: null,
      });
    } catch (err) {
      
        return sendResponse(req, res, 500, {
        status: false,
        data: err,
        message: `failed to export data`,
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }
}

