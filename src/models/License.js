const crypto = require('crypto');
const mongoose = require('mongoose');

const activationSchema = new mongoose.Schema(
    {
        computerId: { type: String, required: true, trim: true },
        computerName: { type: String, trim: true, maxlength: 200 },
        ipAddress: { type: String, trim: true },
        userAgent: { type: String, trim: true },
        activatedAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const licenseSchema = new mongoose.Schema(
    {
        codeHash: { type: String, required: true, unique: true, index: true },
        codePrefix: { type: String, required: true },
        name: { type: String, required: true, trim: true, maxlength: 200 },
        status: { type: String, enum: ['active', 'disabled'], default: 'active' },
        expiresAt: { type: Date, default: null },
        maxActivations: { type: Number, min: 1, default: 1 },
        activations: { type: [activationSchema], default: [] }
    },
    { timestamps: true, versionKey: false }
);

licenseSchema.methods.isExpired = function isExpired() {
    return this.expiresAt !== null && this.expiresAt.getTime() < Date.now();
};

licenseSchema.methods.toPublicJSON = function toPublicJSON() {
    const license = this.toObject();
    delete license.codeHash;
    return license;
};

function hashLicenseCode(code) {
    return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

licenseSchema.statics.hashCode = hashLicenseCode;

module.exports = mongoose.model('License', licenseSchema);
