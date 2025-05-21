import mongoose from "mongoose";
import { z } from "zod";

export const SerialSchemaDb = z
  .object({
    serial: z.string(),
  })
  .strip();

type SerialDb = z.infer<typeof SerialSchemaDb>;

const serialSchema = new mongoose.Schema<SerialDb>({
  serial: String,
});

export const SerialModel = mongoose.model<SerialDb>("serial", serialSchema);
