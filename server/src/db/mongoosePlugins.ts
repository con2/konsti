import mongoose, { Schema } from "mongoose";

mongoose.plugin((schema: Schema) => {
  schema.set("toJSON", {
    // toJSON() removes _id and __v
    transform(document, returnedObject) {
      delete returnedObject._id;
      delete returnedObject.__v;
    },
  });
});
