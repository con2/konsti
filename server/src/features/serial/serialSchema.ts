import mongoose from 'mongoose';
import { SerialDoc } from 'server/typings/serial.typings';

const SerialSchema = new mongoose.Schema({
  serial: String,
});

export const SerialModel = mongoose.model<SerialDoc>('Serial', SerialSchema);
