import mongoose from 'mongoose';
import { SerialDoc } from 'typings/serial.typings';

const SerialSchema = new mongoose.Schema({
  serial: String,
});

export const SerialModel = mongoose.model<SerialDoc>('Serial', SerialSchema);
