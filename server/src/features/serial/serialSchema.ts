import mongoose from "mongoose";
import { Serial } from "server/types/serialTypes";

const SerialSchema = new mongoose.Schema({
  serial: String,
});

interface SerialDoc extends Serial, mongoose.Document {}

export const SerialModel = mongoose.model<SerialDoc>("serial", SerialSchema);
