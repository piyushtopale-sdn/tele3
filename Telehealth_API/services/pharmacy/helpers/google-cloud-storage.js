const Cloud = require('@google-cloud/storage')
const serviceAccount = JSON.parse(process.env.GCS_KEYFILE_JSON);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
import { config } from "../config/constants";
const { BUCKET_NAME } = config

const { Storage, TransferManager } = Cloud
const storage = new Storage({
  credentials: serviceAccount,
  projectId: 'test_pdev',
})
const transferManager = new TransferManager(storage.bucket(BUCKET_NAME)); // Used to upload multiple files

module.exports = {
  storage: storage.bucket(BUCKET_NAME),
  transferManager
}