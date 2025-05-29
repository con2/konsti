import mongoose from "mongoose";
import { z } from "zod";

export const SerialSchemaDb = z
  .object({
    serial: z.string(),
  })
  .strip();

const serialSchema = new mongoose.Schema({
  serial: { type: String, required: true },
});

export const SerialModel = mongoose.model("serial", serialSchema);
