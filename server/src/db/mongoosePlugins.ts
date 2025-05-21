import mongoose, { Schema } from "mongoose";
import mongooseLeanGetters from "mongoose-lean-getters";

mongoose.plugin((schema: Schema) => {
  schema.set("toJSON", {
    // toJSON() removes _id and __v
    transform(_document, returnedObject) {
      delete returnedObject._id;
      delete returnedObject.__v;
    },
  });
});

// Enable lean() getters and always apply getters
mongoose.plugin(mongooseLeanGetters, { defaultLeanOptions: { getters: true } });

// Always apply getters
mongoose.set("toObject", { getters: true, virtuals: true });
mongoose.set("toJSON", { getters: true, virtuals: true });
