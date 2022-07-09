import mongoose from "mongoose";
import { RequiredString } from "server/db/mongooseTypes";
import { SerialDoc } from "server/typings/serial.typings";

const SerialSchema = new mongoose.Schema({
  serial: RequiredString,
});

export const SerialModel = mongoose.model<SerialDoc>("Serial", SerialSchema);
