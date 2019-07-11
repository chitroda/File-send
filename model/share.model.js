const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.set('useFindAndModify', false);

const list_file = new Schema({
    type: Array,
    size: Array,
    dir_name: String,
    file: Array,
    client_ip: String,
    token: String,
    time_stamp: {type: Date, default: Date.now},
    expiry_limit: Number,
    expiry_time: Number,
    first_download_check: Number
},
{
    collection: 'file_list'
});

module.exports = mongoose.model('file_list',list_file);