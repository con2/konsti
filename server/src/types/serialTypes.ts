import mongoose, { ObjectId } from "mongoose";

export interface SerialDoc extends Serial, mongoose.Document<ObjectId> {}

export interface Serial {
  serial: string;
}
