const express = require('express');
const router = express.Router();

const controller = require('../controller/share.controller');

router.get('/', controller.main);
router.post('/', controller.upload_files);
//router.post('/download', controller.validate_download);
router.get('/download/:id/:uid', controller.download_page);
router.get('/download-files/:id/:uid', controller.download_files);

module.exports = router;