const crypto = require('crypto');
const License = require('../models/License');

function normalizeCode(code) {
    return typeof code === 'string' ? code.trim() : '';
}

function getCodePrefix(code) {
    return code.slice(0, Math.min(code.length, 4));
}

function getValidationError(license) {
    if (!license) return 'License code is invalid';
    if (license.status !== 'active') return 'License is disabled';
    if (license.isExpired()) return 'License has expired';
    return null;
}

function parseLicenseFields(body) {
    const fields = {};
    if (body.name !== undefined) fields.name = body.name;
    if (body.status !== undefined) fields.status = body.status;
    if (body.expiresAt !== undefined) fields.expiresAt = body.expiresAt || null;
    if (body.maxActivations !== undefined) fields.maxActivations = body.maxActivations;
    return fields;
}

async function createLicense(req, res, next) {
    try {
        const code = normalizeCode(req.body.code) || crypto.randomBytes(12).toString('hex').toUpperCase();
        const fields = parseLicenseFields(req.body);

        if (!fields.name) {
            return res.status(400).json({ message: 'name is required' });
        }

        const license = await License.create({
            ...fields,
            codeHash: License.hashCode(code),
            codePrefix: getCodePrefix(code)
        });

        return res.status(201).json({
            message: 'License created',
            license: license.toPublicJSON(),
            code
        });
    } catch (error) {
        return next(error);
    }
}

async function listLicenses(req, res, next) {
    try {
        const licenses = await License.find().sort({ createdAt: -1 });
        return res.json({ licenses: licenses.map((license) => license.toPublicJSON()) });
    } catch (error) {
        return next(error);
    }
}

async function getLicense(req, res, next) {
    try {
        const license = await License.findById(req.params.id);
        if (!license) return res.status(404).json({ message: 'License not found' });
        return res.json({ license: license.toPublicJSON() });
    } catch (error) {
        return next(error);
    }
}

async function updateLicense(req, res, next) {
    try {
        const fields = parseLicenseFields(req.body);
        const code = normalizeCode(req.body.code);

        if (code) {
            fields.codeHash = License.hashCode(code);
            fields.codePrefix = getCodePrefix(code);
        }

        const license = await License.findByIdAndUpdate(req.params.id, fields, {
            new: true,
            runValidators: true
        });

        if (!license) return res.status(404).json({ message: 'License not found' });
        return res.json({ message: 'License updated', license: license.toPublicJSON() });
    } catch (error) {
        return next(error);
    }
}

async function deleteLicense(req, res, next) {
    try {
        const license = await License.findByIdAndDelete(req.params.id);
        if (!license) return res.status(404).json({ message: 'License not found' });
        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
}

async function activateLicense(req, res, next) {
    try {
        const code = normalizeCode(req.body.code);
        const computerId = typeof req.body.computerId === 'string' ? req.body.computerId.trim() : '';

        if (!code || !computerId) {
            return res.status(400).json({ message: 'code and computerId are required' });
        }

        const license = await License.findOne({ codeHash: License.hashCode(code) });
        const validationError = getValidationError(license);
        if (validationError) return res.status(403).json({ valid: false, message: validationError });

        const existingActivation = license.activations.find((activation) => activation.computerId === computerId);
        if (existingActivation) {
            return res.json({ valid: true, alreadyActivated: true, license: license.toPublicJSON() });
        }

        if (license.activations.length >= license.maxActivations) {
            return res.status(403).json({ valid: false, message: 'License activation limit reached' });
        }

        license.activations.push({
            computerId,
            computerName: req.body.computerName,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        await license.save();

        return res.status(201).json({
            valid: true,
            alreadyActivated: false,
            message: 'License activated',
            license: license.toPublicJSON()
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createLicense,
    listLicenses,
    getLicense,
    updateLicense,
    deleteLicense,
    activateLicense
};
