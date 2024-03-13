const mongoose = require("mongoose");

const entitySchema = mongoose.Schema(
    {
        fullname: { type: String, required: true },
        username: { type: String, required: true },
        role: { type: String, required: true },
        password: { type: String, required: true },
        createdAt: { type: Date, immutable: true, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

entitySchema.pre("save", function (next) {
    if (this.isNew) {
        this.createdAt = Date.now();
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("authors", entitySchema);
