import "dotenv/config.js";
import mongoose from "mongoose";
import { config } from "./constants";
const { DB } = config;

const options = {
  user: DB.USERNAME,
  pass: DB.PASSWORD,
};

const MONGOURI = `mongodb://${DB.HOST}:${DB.PORT}/${DB.DATABASE}`;

const InitiateMongoServer = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGOURI, options);
    console.log("Connected to superadmin DB !!", MONGOURI);
  } catch (e) {
    console.error("An error occurred:", e);
    throw e;
  }
};

module.exports = InitiateMongoServer;
