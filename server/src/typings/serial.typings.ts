import mongoose from 'mongoose';

export interface SerialDoc extends Serial, mongoose.Document {}

export interface Serial {
  serial: string;
}
