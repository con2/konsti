import mongoose from "mongoose";
import { SerialDoc } from "server/types/serialTypes";

const SerialSchema = new mongoose.Schema({
  serial: String,
});

export const SerialModel = mongoose.model<SerialDoc>("Serial", SerialSchema);
