import mongoose from "mongoose";
import Group from '../models/GroupSchema.js';
import { DATABASE_URL } from "../env.js";
import data from "./mock.js";

mongoose.connect(DATABASE_URL);

await Group.deleteMany({});
await Group.insertMany({data});





mongoose.connection.close();