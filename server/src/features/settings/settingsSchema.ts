import mongoose from 'mongoose';
import { SettingsDoc } from 'server/typings/settings.typings';

const SettingsSchema = new mongoose.Schema(
  {
    hiddenGames: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Game', default: [] },
    ],
    signupTime: { type: Date, default: undefined },
    appOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<SettingsDoc>(
  'Settings',
  SettingsSchema
);
