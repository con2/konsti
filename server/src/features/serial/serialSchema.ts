import mongoose from "mongoose";
import { z } from "zod";

export const SerialSchemaDb = z
  .object({
    serial: z.string(),
  })
  .strip();

const serialSchema = new mongoose.Schema({
  serial: String,
});

export const SerialModel = mongoose.model("serial", serialSchema);
