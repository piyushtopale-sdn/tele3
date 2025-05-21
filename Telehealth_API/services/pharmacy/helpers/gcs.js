const { storage } = require('./google-cloud-storage')

export const generateSignedUrl = (fileName) => {
    return new Promise(async(resolve) => {
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
            console.error("An error occurred:", error);
            resolve("")
        }
    })
};