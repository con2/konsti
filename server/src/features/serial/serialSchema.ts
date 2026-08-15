// Registers the global mongoose plugins, which are applied when a model is
// compiled below, so it has to stay above the other imports
import "server/db/mongoosePlugins";
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
