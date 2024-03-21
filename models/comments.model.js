const mongoose = require("mongoose");

const entitySchema = mongoose.Schema({
content: {type : String,required: true,},author: {type : mongoose.Schema.Types.ObjectId,ref: "users",required: true,},post: {type : mongoose.Schema.Types.ObjectId,ref: "posts",required: true,},createdAt: { type: Date, immutable: true, default: Date.now },updatedAt: { type: Date, default: Date.now }}
, { timestamps: true });

entitySchema.pre("save", function (next) {
    if (this.isNew) {
        this.createdAt = Date.now();
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("comments", entitySchema);
