const Cloud = require('@google-cloud/storage')
const path = require('path')
const serviceKey = path.join(__dirname, './test_pdev-e8014ee799f2.json')
import { config } from "../config/constants";
const { BUCKET_NAME } = config

const { Storage, TransferManager } = Cloud
const storage = new Storage({
  keyFilename: serviceKey,
  projectId: 'test_pdev',
})
const transferManager = new TransferManager(storage.bucket(BUCKET_NAME)); // Used to upload multiple files

module.exports = {
  storage: storage.bucket(BUCKET_NAME),
  transferManager
}