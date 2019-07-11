'use strict';
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const port = process.env.port || 2001;
const share_routes = require('./routes/share.route');

// To prevent user from using back button after session expires
app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/public', express.static('public'));
app.use(fileUpload());
app.use('/', share_routes);
app.use(function(req, res, next){
    res.status(404).render('notavailable.ejs');
});

// MongoDB config
const MONGO_HOSTNAME = 'localhost';
const MONGO_PORT = '27017';
const MONGO_DB = 'file_share';
const url = `mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}`;
mongoose.connect(url, {useNewUrlParser: true})
.then(() => console.log('Connection Successful'))
.catch((err) => console.error(err));

app.listen(port, () => {
    console.log('Server is running at: '+port);
});