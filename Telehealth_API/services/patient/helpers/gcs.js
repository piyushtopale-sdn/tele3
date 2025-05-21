import { generateRandomString } from '../middleware/utils';
import convert from 'heic-convert';
const fs = require('fs/promises')
const { storage } = require('./google-cloud-storage')
const path = require('path')

const localDestination = path.join(__dirname, '../uploads')

export const uploadSingleOrMultipleDocuments = (req) => {
    return new Promise((resolve) => {
        (async () => {
            try {
                const { userId, docType, serviceType } = req.body;
                const files = req.files.file;
                let keysArray = [];

                if (req?.files?.file?.length > 0) {
                    // Multiple files
                    let uploadArray = [];
                    let tempPathArray = [];

                    for (const file of files) {
                        let fileExtension = file.mimetype.split('/').pop();
                        let tmpPath = file?.tempFilePath;

                        if (fileExtension === 'heic' || fileExtension === 'heif') {
                            fileExtension = 'jpeg';
                            const getTempBufferData = await fs.readFile(tmpPath);
                            const bufferData = await convert({
                                buffer: getTempBufferData,
                                format: 'JPEG',
                            });
                            tmpPath = `${localDestination}/_file-${Date.now()}.jpeg`;
                            await fs.writeFile(tmpPath, bufferData);
                            tempPathArray.push(tmpPath);
                        }

                        const fileName = `_file-${Date.now()}-${generateRandomString(10)}.${fileExtension}`;
                        const options = {
                            destination: `${serviceType}/${userId}/${docType}/${fileName}`,
                        };

                        uploadArray.push(storage.upload(tmpPath, options));
                        keysArray.push(options?.destination);
                    }

                    await Promise.all(uploadArray);

                    for (const path of tempPathArray) {
                        await fs.unlink(path);
                    }
                } else {
                    let fileExtension = files.mimetype.split('/').pop();
                    let tmpPath = files?.tempFilePath;
                    let oldExtension;

                    if (fileExtension === 'heic' || fileExtension === 'heif') {
                        oldExtension = fileExtension;
                        fileExtension = 'jpeg';
                        const getTempBufferData = await fs.readFile(tmpPath);
                        const bufferData = await convert({
                            buffer: getTempBufferData,
                            format: 'JPEG',
                        });
                        tmpPath = `${localDestination}/_file-${Date.now()}.jpeg`;
                        await fs.writeFile(tmpPath, bufferData);
                    }

                    const fileName = `_file-${Date.now()}-${generateRandomString(10)}.${fileExtension}`;
                    const options = {
                        destination: `${serviceType}/${userId}/${docType}/${fileName}`,
                    };

                    await storage.upload(tmpPath, options);

                    if (oldExtension === 'heic' || oldExtension === 'heif') {
                        await fs.unlink(tmpPath);
                    }

                    keysArray.push(options?.destination);
                }

                resolve(keysArray);
            } catch (error) {
                console.error('Error while uploading documents', error);
                resolve(''); // Consider using reject(error) if it's truly an error case
            }
        })();
    });
};

export const generateSignedUrl = (fileName) => {
    return new Promise((resolve) => {
        (async () => {
            try {
                const options = {
                    version: 'v4',
                    action: 'read',
                    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
                };

                const [url] = await storage.file(fileName).getSignedUrl(options);
                resolve(url);
            } catch (error) {
                console.error('Error generating signed URL:', error);
                resolve('');
            }
        })();
    });
};

export const deleteGCSFile = (fileName) => {
    return new Promise((resolve) => {
        (async () => {
            try {
                await storage.file(fileName).delete();
                resolve(true);
            } catch (error) {
                console.error('Error deleting GCS file:', error);
                resolve('');
            }
        })();
    });
};
