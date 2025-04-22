import { sendResponse } from "../../helpers/transmission";
import Category from "../../models/category";

export const addCategory = async (req, res) => {
    try {
        const { categoryData } = req.body

        let existingCategory = []
        for (const data of categoryData) {
            const getCategory = await Category.find({ categoryName: data.categoryName, isDeleted: false })
            if (getCategory.length > 0) {
                existingCategory.push(data.categoryName)
            } else {
                const addCategory = new Category(data)
                await addCategory.save()
            }
        }
        let message = "Category added successfully"
        if (categoryData.length == existingCategory.length) {
            message = `This ${existingCategory.join(", ")} categories already exists.`
        } else if(existingCategory.length > 0 && categoryData.length != existingCategory.length) {
            message = `This ${existingCategory.join(", ")} categories already exists. Remaining are added successfully`
        } else {
            message = `Categories added successfully.`
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

export const getCategory = async (req, res) => {
    try {
        const { page, limit, searchText, status, sort, fromDate, toDate  } = req.query

        let search_filter = [{}]
        if (searchText) {
            search_filter = [
                { categoryName: {$regex: searchText || '', $options: "i"} }
            ]
        }

        let match = {
            isDeleted: false,
            $or: search_filter
        }
        if (status && status != 'all') {
            match.status = status == 'active' ? true : false
        }
        if(fromDate && toDate) {
            const fromDateObj = new Date(`${fromDate} 00:00:00`);
            const toDateObj = new Date(`${toDate} 23:59:59`);
            match['$and'] = [{
              createdAt: { $gte: fromDateObj, $lte: toDateObj }
            }]
          }

        let fieldName = 'createdAt'
        let sortOrder = '-1'
        if (sort) {
            fieldName = sort.split(':')[0]
            sortOrder = sort.split(':')[1]
        }

        const pipeline = [
            {
                $match: match
            },
            {
                $group: {
                    _id: "$_id",
                    categoryName: { $first: "$categoryName"},
                    categoryNameArabic: { $first: "$categoryNameArabic"},
                    categoryDescription: { $first: "$categoryDescription"},
                    description: { $first: "$description"},
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
            pipeline[pipeline.length - 1]['$facet']['paginatedResults'] = [
                { $skip: 0 }, 
            ]
        }

        const result = await Category.aggregate(pipeline)
        let totalCount = 0
        if (result[0].totalCount.length > 0) {
            totalCount = result[0].totalCount[0].count
        }


        return sendResponse(req, res, 200, {
            status: true,
            message: "Category fetched successfully",
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

export const updateCategory = async (req, res) => {
    try {
        const { categoryId, categoryName, categoryNameArabic, categoryDescription, description, status } = req.body

        const getCategory = await Category.find({ categoryName, isDeleted: false, _id: {$ne: categoryId} })

        if (getCategory.length > 0) {
            return sendResponse(req, res, 400, {
                status: false,
                body: null,
                message: "Category already exist",
                errorCode: null,
            })
        }


       await Category.findOneAndUpdate(
        {
            _id: categoryId,
        },
        {
            $set: {
                categoryName,
                categoryNameArabic,
                categoryDescription,
                description,
                status
            }
        }
       )
       return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: `Category updated successfully`,
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

export const updateCategoryByAction = async (req, res) => {
    try {
        const { categoryId, actionName, actionValue, categoryIds } = req.body

        if (actionName == 'isDeleted' && categoryIds.length > 0) {
            await Category.updateMany(
                {
                    _id: { $in: categoryIds },
                },
                {
                    $set: {
                        [actionName]: actionValue
                    }
                }
            )
        } else {
            await Category.findOneAndUpdate(
                {
                    _id: categoryId,
                },
                {
                    $set: {
                        [actionName]: actionValue
                    }
                }
            )  
        }
        return sendResponse(req, res, 200, {
            status: true,
            body: null,
            message: `Category ${actionName == 'isDeleted' ? 'deleted' : 'updated'} successfully`,
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

export const allCategoryforexport = async (req, res) => {
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
        result = await Category.find(filter)
          .sort([["createdAt", -1]])
          .skip((page - 1) * limit)
          .limit(limit * 1)
          .exec();
      }
      else {
        result = await Category.aggregate([{
          $match: filter
        },
        { $sort: { "createdAt": -1 } },
        {
          $project: {
            _id: 0,
            categoryName: "$categoryName",
            description: "$description"
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
