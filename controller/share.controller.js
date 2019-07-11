const model = require('../model/share.model');
const fs = require('fs');
const rand = require('rand-token');
const path = require('path');
const fsExtra = require('fs-extra');
const cryptoRandomString = require('crypto-random-string');
const dateDiff = require('date-diff');
const zlib = require('zlib');
const zipFolder = require('zip-folder');
const unzip = require('unzip');

exports.main = function(req,res){
    res.render('index.ejs',{
        token: '',
        error: '',
        expiry_count: '',
        expiry_time: ''
    });
};

exports.upload_files = function(req,res){
    if(req.files === null){
        res.render('index.ejs',{
            token: '',
            error: 'Minimum file size should be 1KB'
        });
        return;
    }
    var chk_total_size = 0;
    if(Array.isArray(req.files.files)){
        req.files.files.forEach((getSize) => {
            chk_total_size = chk_total_size + parseInt((((parseInt(getSize.size))/1024)/1024).toFixed(2));
        });
    }else{
        chk_total_size = chk_total_size + parseInt((((parseInt(req.files.files.size))/1024)/1024).toFixed(2));
    }
    if(chk_total_size > 1024){
        res.render('index.ejs',{
            token: '',
            error: 'File size must be less than 2MB'
        });
        return;
    }

    var removed_file_list = req.body.removed_file.split(',');
    for(var i=0; i<removed_file_list.length; i++){
        delete req.files.files[removed_file_list[i]];
    }

    let file = req.files.files;
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    let new_directory = rand.generate(10);
    var file_token = cryptoRandomString({length: 10, type: 'url-safe'})+'/'+cryptoRandomString({length: 15, type: 'url-safe'});
    var download_url = req.headers.host+'/download/'+file_token;
    var new_path = './public/files/'+new_directory;
    let file_size = [], file_type = [], file_self = [];
    var expiry_limit = '';
    if(req.body.expiry_count <= 10){
        expiry_limit = req.body.expiry_count;
    } else {
        expiry_limit = 1;
    }

    var expiry_time = '';
    if(req.body.expiry_time <= 1440 && req.body.expiry_time > 0){
        expiry_time = req.body.expiry_time;
    }else{
        expiry_time = 5;
    }

    try{
        if(!fs.existsSync(new_path)){
            fs.mkdirSync(new_path);
        }
    }
    catch(err){
        console.log(err);
    }

    if(file.length > 1){
        file.forEach((file_data) => {
            let file_name = file_data.name;
            file_size.push((((parseInt(file_data.size))/1024)/1024).toFixed(2)+'mb');
            file_type.push(file_data.mimetype);
            file_self.push(file_name);
            async function upload_input(new_path,file_name){
                await file_data.mv(`${new_path}/${file_name}`, (err) => {
                    if(err) throw err;
                    console.log('File uploded');
                });
            }
            upload_input(new_path,file_name);
        });
    }else{
        let file_name = file.name;
        file_size.push((((parseInt(file.size))/1024)/1024).toFixed(2)+'mb');
        file_type.push(file.mimetype);
        file_self.push(file_name);
        async function upload_input(new_path,file_name){
            await file.mv(`${new_path}/${file_name}`, (err) => {
                if(err) throw err;
                console.log('File uploded');
            });
        }
        upload_input(new_path,file_name);
    }

    zipFolder(new_path,new_path+'.zip',(err) => {
        if(err) throw err;
        fsExtra.remove(new_path, (err) => {
            if(err) throw err;
        });
    });

    var new_file = new model({
        type: file_type,
        size: file_size,
        dir_name: new_directory,
        file: file_self,
        client_ip: ip,
        token: file_token,
        expiry_limit: expiry_limit,
        expiry_time: expiry_time,
        first_download_check: 0
    });
    async function file_in_db(new_file){
        await new_file.save(function(err,data){
            if(err) throw err;
            console.log('Inserted into db');
        });
    }
    file_in_db(new_file);

	var file_expiry_time;
	if(expiry_time == 5){
		file_expiry_time = '5min';
	}else if(expiry_time == 60){
		file_expiry_time = '1hour';
	}else if(expiry_time == 1440){
		file_expiry_time = '1day';
	}else{
		file_expiry_time = '5min';
	}

    res.render('index.ejs',{
        token: download_url,
        error: '',
        expiry_count: expiry_limit,
		expiry_time: file_expiry_time
    });
};

exports.download_page = (req,res) => {
    var token_file = req.params.id+'/'+req.params.uid;
    model.find({token: token_file},['expiry_limit','file','expiry_time']).exec((err,result) => {
        if(err) throw err;
        if(result.length > 0){
			var file_expiry_time;
			if(result[0]['expiry_time'] == 5){
				file_expiry_time = '5min';
			}else if(result[0]['expiry_time'] == 60){
				file_expiry_time = '1hour';
			}else if(result[0]['expiry_time'] == 1440){
				file_expiry_time = '1day';
			}else{
				file_expiry_time = '5min';
			}
			
            var file_name = [];
            result[0]['file'].forEach((data) => {
                file_name.push(data.split('/')[1]);
            });
            res.render('files.ejs', {
                expiry_count: result[0]['expiry_limit'],
                file_name: result[0]['file'],
				expiry_time: file_expiry_time
            });
        }else{
            res.render('index.ejs',{
                token: '',
                error: 'Your download expired!'
            });
        }
    });
};

exports.download_files = (req,res)  =>  {
    var token_file = req.params.id+'/'+req.params.uid;
    model.find({token: token_file},{type: 0, size: 0, client_ip: 0}).exec((err,result) => {
        if(err) throw err;
        if(result.length > 0){
            var d1 = new Date();
            var d2 = result[0]['time_stamp'];

            var diffs = new dateDiff(d1, d2);
            var current_minute = diffs.minutes();
            var client_expiry_time = result[0]['expiry_time'];

            var id = result[0]['_id'];
            var expiry_limit = result[0]['expiry_limit'];
            var dir_name = './public/files/'+result[0]['dir_name'];

            if(!result[0]['first_download_check']){
                model.findOneAndUpdate({token: token_file}, {$set: {first_download_check: 1}}, (err) => {
                    if(err) throw err;
                });
            }

            model.findOneAndUpdate({token: token_file}, {$set: {expiry_limit: expiry_limit-1}}, (err) => {
                if(err) throw err;
            });

            if(client_expiry_time >= current_minute){   //Check if expiary time is less then current time
                if(expiry_limit === 1){ //Check if download limit is 1
                    if(result[0]['file'].length > 1){
                        res.download(dir_name+'.zip', function(err) {
                            if(err) throw err;
                            fsExtra.remove(dir_name+'.zip', (err) => {
                                if(err) throw err;
                                model.findOneAndDelete(id, (error) => {
                                    if(error) throw error;
                                });
                            });
                        });
                    }else{
                        fs.createReadStream(dir_name+'.zip').pipe(unzip.Extract({ path: dir_name })).on('close', () => {
                            res.download(dir_name+'/'+result[0]['file'][0], (err) => {
                                if(err) throw(err);
                                fsExtra.remove(dir_name, (err) => {
                                    if(err) throw err;
                                    model.findOneAndDelete(id, (error) => {
                                        if(error) throw error;
                                    });
                                });
                                fsExtra.remove(dir_name+'.zip', (err) => {
                                    if(err) throw err;
                                });
                            });
                        });
                    }
                }else{ //Controll comes to else if download limit is more than 1
                    if(result[0]['file'].length > 1){
                        res.download(dir_name+'.zip');
                    }else{
                        fs.createReadStream(dir_name+'.zip').pipe(unzip.Extract({ path: dir_name })).on('close', () => {
                            res.download(dir_name+'/'+result[0]['file'][0], (err) => {
                                if(err) throw(err);
                                fsExtra.remove(dir_name, (err) => {
                                    if(err) throw err;
                                });
                            });
                        });
                    }
                    
                }
            }
            else{
                res.render('index.ejs',{
                    token: '',
                    error: 'Your download expired!'
                });
                fsExtra.remove(dir_name+'.zip', (err) => {
                    if(err) throw err;
                    model.findOneAndDelete(id, (error) => {
                        if(error) throw error;
                    });
                });
            }
        }
        else{
            res.render('index.ejs',{
                token: '',
                error: 'Your download expired!'
            });
        }

    });
};