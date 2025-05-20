
import { addNotification, editNotification, getNotificationList, getNotificationById, getNotificationByCondition, deleteNotification } from '../controllers/Notification-management/notification-management';

import NotificationManagement from "../models/superadmin/notification-management" // Assuming you have a User model
import httpMocks from 'node-mocks-http';
import mongoose from "mongoose";
import { sendResponse } from "../helpers/transmission";

jest.mock('../models/superadmin/notification-management');
jest.mock('../helpers/transmission');

describe("Notification Controller - addNotification", () => {
    let req, res;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        req.user = { _id: "userId123" }; // Mocked user ID
    });

    it("should add a notification successfully", async () => {
        // Set up the mock request body
        req.body = {
            notification_title: "New Notification",
            notification_type: "Email",
            condition: "condition1",
            content: "This is a test notification"
        };
    
        // Spy on the static find method and mock its resolved value
        const findSpy = jest.spyOn(NotificationManagement, 'find').mockResolvedValue([]);
    
        // Spy on the prototype save method and mock its resolved value
        const saveSpy = jest.spyOn(NotificationManagement.prototype, 'save').mockResolvedValue({});
        
        // Call the function to test
        await addNotification(req, res);
    
        // Check that find was called with the correct arguments
        expect(findSpy).toHaveBeenCalledWith({
            condition: "condition1",
            notification_type: "Email",
            is_deleted: false,
        });
    
        // Check that save was called on the instance
        expect(saveSpy).toHaveBeenCalled();
    
        // Assert the response sent by sendResponse
        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            body: null,
            message: "Notification added successfully.",
            errorCode: null,
        });
    
        // Optionally, restore the original functionality after the test
        findSpy.mockRestore();
        saveSpy.mockRestore();
    });

    it("should return 200 when notification already exists", async () => {
        req.body = {
            notification_title: "Duplicate Notification",
            notification_type: "Email",
            condition: "condition1",
            content: "Duplicate content"
        };
        NotificationManagement.find = jest.fn().mockResolvedValue([]);

        NotificationManagement.find.mockResolvedValue([{
            _id: "existingNotificationId"
        }]); // Simulate existing notification

        await addNotification(req, res);

        expect(NotificationManagement.find).toHaveBeenCalledWith({
            condition: "condition1",
            notification_type: "Email",
            is_deleted: false,
        });

        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            body: null,
            message: "Notification already exist with same condition and notification type",
            errorCode: null,
        });
    });

    it("should return 500 on internal server error", async () => {
        req.body = {
            notification_title: "Error Notification",
            notification_type: "Email",
            condition: "condition1",
            content: "Error content"
        };

        NotificationManagement.find.mockRejectedValue(new Error("Database error")); // Simulate DB error

        await addNotification(req, res);

        expect(sendResponse).toHaveBeenCalledWith(req, res, 500, {
            status: false,
            body: null,
            message: "Failed to add notification.",
            errorCode: "INTERNAL_SERVER_ERROR",
        });
    });
});

describe('"Notification Controller - editNotification', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                id: '12345',
                notification_title: 'Updated Title',
                notification_type: 'Email',
                condition: 'condition1',
                content: 'Updated Content'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('should update notification successfully', async () => {
        // Mock the find method to return an empty array (no existing notifications)
        NotificationManagement.find = jest.fn().mockResolvedValue([]);
        // Mock findOneAndUpdate to resolve successfully
        NotificationManagement.findOneAndUpdate = jest.fn().mockResolvedValue({});

        await editNotification(req, res);

        expect(NotificationManagement.find).toHaveBeenCalledWith({
            condition: 'condition1',
            notification_type: 'Email',
            is_deleted: false,
            _id: { $ne: '12345' }
        });

        expect(NotificationManagement.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: '12345' },
            {
                $set: {
                    notification_title: 'Updated Title',
                    notification_type: 'Email',
                    condition: 'condition1',
                    content: 'Updated Content'
                }
            }
        );

        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            body: null,
            message: 'Notification updated successfully.',
            errorCode: null
        });
    });

    it('should return an error if notification with same condition and type exists', async () => {
        // Mock the find method to return an array (indicating an existing notification)
        NotificationManagement.find = jest.fn().mockResolvedValue([{ _id: 'anotherId' }]);
        // Ensure findOneAndUpdate is not called
        NotificationManagement.findOneAndUpdate = jest.fn();

        await editNotification(req, res);

        expect(NotificationManagement.find).toHaveBeenCalledWith({
            condition: 'condition1',
            notification_type: 'Email',
            is_deleted: false,
            _id: { $ne: '12345' }
        });

        expect(NotificationManagement.findOneAndUpdate).not.toHaveBeenCalled();
        
        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            body: null,
            message: 'Notification already exist with same condition and notification type',
            errorCode: null
        });
    });

    it('should handle errors properly', async () => {
        // Mock the find method to throw an error
        NotificationManagement.find = jest.fn().mockRejectedValue(new Error('Database Error'));

        await editNotification(req, res);

        expect(sendResponse).toHaveBeenCalledWith(req, res, 500, {
            status: false,
            body: null,
            message: 'Failed to edit notification.',
            errorCode: 'INTERNAL_SERVER_ERROR'
        });
    });
});

describe('Notification Controller - getNotificationList', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {
                limit: 10,
                page: 1,
                searchText: '',
                type: 'all'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('should retrieve and return a paginated list of notifications successfully', async () => {
        const mockResult = [
            {
                totalCount: [{ count: 2 }],
                paginatedResults: [
                    { _id: '1', notification_title: 'Title 1', notification_type: 'Email', condition: 'condition1', createdAt: new Date() },
                    { _id: '2', notification_title: 'Title 2', notification_type: 'SMS', condition: 'condition2', createdAt: new Date() }
                ]
            }
        ];

        NotificationManagement.aggregate = jest.fn().mockResolvedValue(mockResult);

        await getNotificationList(req, res);

        expect(NotificationManagement.aggregate).toHaveBeenCalledWith(expect.any(Array));
        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            body: {
                data: mockResult[0].paginatedResults,
                totalPages: 1,
                currentPage: 1,
                totalRecords: 2,
            },
            message: 'List fetched successfully',
        });
    });

    it('should handle search text filter', async () => {
        req.query.searchText = 'Title 1';
        const mockResult = [
            {
                totalCount: [{ count: 1 }],
                paginatedResults: [
                    { _id: '1', notification_title: 'Title 1', notification_type: 'Email', condition: 'condition1', createdAt: new Date() }
                ]
            }
        ];

        NotificationManagement.aggregate = jest.fn().mockResolvedValue(mockResult);

        await getNotificationList(req, res);

        expect(NotificationManagement.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                $match: expect.objectContaining({
                    is_deleted: false,
                    $or: [{
                        notification_title: { $regex: 'Title 1', $options: 'i' }
                    }],
                    $and: [{}]
                })
            }),
            expect.objectContaining({
                $group: expect.objectContaining({
                    _id: "$_id",
                    notification_title: { $first: "$notification_title" },
                    notification_type: { $first: "$notification_type" },
                    condition: { $first: "$condition" },
                    createdAt: { $first: "$createdAt" }
                })
            }),
            expect.objectContaining({
                $sort: expect.objectContaining({
                    createdAt: -1
                })
            }),
            expect.objectContaining({
                $facet: expect.objectContaining({
                    totalCount: [expect.objectContaining({ $count: 'count' })],
                    paginatedResults: [
                        expect.objectContaining({ $skip: (req.query.page - 1) * req.query.limit }),
                        expect.objectContaining({ $limit: Number(req.query.limit) })
                    ]
                })
            })
        ]));
        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            body: {
                data: mockResult[0].paginatedResults,
                totalPages: 1,
                currentPage: 1,
                totalRecords: 1,
            },
            message: 'List fetched successfully',
        });
    });

    it('should handle notification type filter', async () => {
        req.query.type = 'Email';
        const mockResult = [
            {
                totalCount: [{ count: 1 }],
                paginatedResults: [
                    { _id: '1', notification_title: 'Title 1', notification_type: 'Email', condition: 'condition1', createdAt: new Date() }
                ]
            }
        ];
    
        // Mock the aggregate method
        NotificationManagement.aggregate = jest.fn().mockResolvedValue(mockResult);
    
        await getNotificationList(req, res);
    
        // Log the actual arguments passed to aggregate
    
        // Check that aggregate was called with the expected pipeline
        expect(NotificationManagement.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                $match: expect.objectContaining({
                    is_deleted: false,
                    $or: [{}],
                    $and: [
                        { notification_type: 'Email' }
                    ]
                })
            }),
            expect.objectContaining({
                $group: expect.objectContaining({
                    _id: "$_id",
                    notification_title: { $first: "$notification_title" },
                    notification_type: { $first: "$notification_type" },
                    condition: { $first: "$condition" },
                    createdAt: { $first: "$createdAt" }
                })
            }),
            expect.objectContaining({
                $sort: expect.objectContaining({
                    createdAt: -1
                })
            }),
            expect.objectContaining({
                $facet: expect.objectContaining({
                    totalCount: [expect.objectContaining({ $count: 'count' })],
                    paginatedResults: [
                        expect.objectContaining({ $skip: (req.query.page - 1) * req.query.limit }),
                        expect.objectContaining({ $limit: Number(req.query.limit) })
                    ]
                })
            })
        ]));
    
        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            body: {
                data: mockResult[0].paginatedResults,
                totalPages: 1,
                currentPage: 1,
                totalRecords: 1,
            },
            message: 'List fetched successfully',
        });
    });
    
    it('should handle errors properly', async () => {
        NotificationManagement.aggregate = jest.fn().mockRejectedValue(new Error('Database Error'));

        await getNotificationList(req, res);

        expect(sendResponse).toHaveBeenCalledWith(req, res, 500, {
            status: false,
            body: new Error('Database Error'),
            message: 'Internal server error',
        });
    });
});

describe('Notification Controller - getNotificationById', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {
                _id: '605c72ef4d8e3b001f8d4c8a' // Example ObjectId
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('should retrieve and return a notification successfully', async () => {
        const mockResult = { _id: '605c72ef4d8e3b001f8d4c8a', notification_title: 'Title 1', notification_type: 'Email', condition: 'condition1', createdAt: new Date() };

        // Mock the findOne method to return a mock result
        NotificationManagement.findOne = jest.fn().mockResolvedValue(mockResult);

        await getNotificationById(req, res);

        // Check that findOne was called with the correct arguments
        expect(NotificationManagement.findOne).toHaveBeenCalledWith({ _id: mongoose.Types.ObjectId(req.query._id) });

        // Check the response
        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            data: mockResult,
            message: 'Notification Fetch successfully',
            errorCode: null,
        });
    });

    it('should handle errors properly', async () => {
        // Mock findOne to throw an error
        NotificationManagement.findOne = jest.fn().mockRejectedValue(new Error('Database Error'));

        await getNotificationById(req, res);

        // Check the response for error handling
        expect(sendResponse).toHaveBeenCalledWith(req, res, 500, {
            status: false,
            data: new Error('Database Error'),
            message: 'Failed to fetch list',
            errorCode: 'INTERNAL_SERVER_ERROR',
        });
    });
});

describe('Notification Controller - getNotificationByCondition', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {
                condition: 'condition1',
                type: 'type1'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('should retrieve and return a notification successfully', async () => {
        const mockResult = [{ _id: '605c72ef4d8e3b001f8d4c8a', notification_title: 'Title 1', notification_type: 'Email', condition: 'condition1', createdAt: new Date() }];

        // Mock the findOne method to return a mock result
        NotificationManagement.find = jest.fn().mockResolvedValue(mockResult);

        await getNotificationByCondition(req, res);

        // Check that findOne was called with the correct arguments
        expect(NotificationManagement.find).toHaveBeenCalledWith({ condition: 'condition1', notification_type: 'type1', is_deleted: false });

        // Check the response
        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            data: mockResult,
            message: 'Notification Fetch successfully',
            errorCode: null,
        });
    });

    it('should handle errors properly', async () => {
        // Mock find to throw an error
        NotificationManagement.find = jest.fn().mockRejectedValue(new Error('Database Error'));

        await getNotificationByCondition(req, res);

        // Check the response for error handling
        expect(sendResponse).toHaveBeenCalledWith(req, res, 500, {
            status: false,
            data: new Error('Database Error'),
            message: 'Failed to fetch list',
            errorCode: 'INTERNAL_SERVER_ERROR',
        });
    });
});

describe('Notification Controller - deleteNotification', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                _id: '605c72ef4d8e3b001f8d4c8a' // Example ObjectId
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('should delete a notification successfully', async () => {
        const mockResult = { _id: '605c72ef4d8e3b001f8d4c8a', is_deleted: true };

        // Mock the findByIdAndUpdate method to return a mock result
        NotificationManagement.findByIdAndUpdate = jest.fn().mockResolvedValue(mockResult);

        await deleteNotification(req, res);

        // Check that findByIdAndUpdate was called with the correct arguments
        expect(NotificationManagement.findByIdAndUpdate).toHaveBeenCalledWith(
            req.body._id,
            { $set: { is_deleted: true } },
            { new: true }
        );

        // Check the response
        expect(sendResponse).toHaveBeenCalledWith(req, res, 200, {
            status: true,
            data: null,
            message: 'Notification Deleted successfully',
            errorCode: null,
        });
    });

    it('should handle case where notification is not found', async () => {
        // Mock findByIdAndUpdate to return null (i.e., no notification found)
        NotificationManagement.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

        await deleteNotification(req, res);

        // Check the response when notification is not found
        expect(sendResponse).toHaveBeenCalledWith(req, res, 400, {
            status: true,
            data: [],
            message: 'Notification Not Deleted',
            errorCode: null,
        });
    });

    it('should handle errors properly', async () => {
        // Mock findByIdAndUpdate to throw an error
        NotificationManagement.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database Error'));

        await deleteNotification(req, res);

        // Check the response for error handling
        expect(sendResponse).toHaveBeenCalledWith(req, res, 500, {
            status: false,
            body: new Error('Database Error'),
            message: 'Internal server error',
        });
    });
});