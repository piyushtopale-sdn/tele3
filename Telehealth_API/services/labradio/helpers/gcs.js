import { generateRandomString } from '../middleware/utils';
const convert = require('heic-convert');
const fs = require('fs/promises')
const { storage } = require('./google-cloud-storage')
const path = require('path')

const localDestination = path.join(__dirname, '../uploads')


/**Feb 12*/
export const uploadSingleOrMultipleDocuments = (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { userId, docType, serviceType } = req.body;
            const files = req.files.file;
            let keysArray = [];
            console.log(req.files, "===req.files");
            // Convert single file to an array for uniform processing
            const fileArray = Array.isArray(files) ? files : [files];
 
            let uploadArray = [];
            let tempPathArray = [];
 
            for (const file of fileArray) {
                let fileExtension = file.mimetype.split('/').pop();
                let fileBuffer = file.data; // Access file data from buffer
                let tmpPath;
 
                if (fileExtension === 'heic' || fileExtension === 'heif') {
                    fileExtension = 'jpeg';
                    fileBuffer = await convert({
                        buffer: fileBuffer,
                        format: 'JPEG',
                    });
 
                    tmpPath = `${localDestination}/_file-${Date.now()}.jpeg`;
                    await fs.writeFile(tmpPath, fileBuffer);
                    tempPathArray.push(tmpPath);
                } else {
                    tmpPath = `${localDestination}/_file-${Date.now()}.${fileExtension}`;
                    await fs.writeFile(tmpPath, fileBuffer);
                    tempPathArray.push(tmpPath);
                }
 
                const fileName = `_file-${Date.now()}-${generateRandomString(10)}.${fileExtension}`;
                const options = {
                    destination: `${serviceType}/${userId}/${docType}/${fileName}`,
                };
 
                uploadArray.push(storage.upload(tmpPath, options).then(() => tmpPath)); // Return file path after upload
                keysArray.push(options?.destination);
            }
 
            // Wait for all uploads to complete
            const uploadedFilePaths = await Promise.all(uploadArray);
 
            // Clean up temp files after successful upload
            for (const path of uploadedFilePaths) {
                await fs.unlink(path);
            }
 
            resolve(keysArray);
        } catch (error) {
            console.error('Error while uploading documents', error);
            resolve('');
        }
    });
};

export const generateSignedUrl = (fileName) => {
    return new Promise(async(resolve, reject) => {
        try {
            const options = {
                version: 'v4', // Signed URL version
                action: 'read', // Allow read access
                expires: Date.now() + 15 * 60 * 1000, // 15 minutes from now
            };
          
            const [url] = await storage
            .file(fileName)
            .getSignedUrl(options);

            resolve(url)
        } catch (error) {
            resolve("")
        }
    })
};