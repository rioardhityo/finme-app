const express = require('express');
const {
    activateLicense,
    createLicense,
    deleteLicense,
    getLicense,
    listLicenses,
    updateLicense
} = require('../controllers/licenseController');

const router = express.Router();

router.post('/activate', activateLicense);
router.route('/').get(listLicenses).post(createLicense);
router.route('/:id').get(getLicense).patch(updateLicense).delete(deleteLicense);

module.exports = router;
