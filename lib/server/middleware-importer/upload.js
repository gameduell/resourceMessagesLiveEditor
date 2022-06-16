var express = require('express'),
    router = express.Router(),
    fs = require('fs'),
    mkdir = require('./../mkdir-p/mkdir-p'),
    acceptedImageExtensions = ['jpeg','jpg','png','gif'],
    directory,
    fileUploadCb;

router.post('/uploadFile',  function (req, res) {

    const folder = '/' + req.query.projectId
    const category = req.query.key
    const projectName = req.query.project
    
    let fstream
    
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, info) {
        // replace all spaces with underscores and prefix it with the project name
        const fName = category.split(' ').join('_')
        const extension = info.filename.split('.')[1]
        const url = folder + '/' + fName + '.' + extension
        const serverFilePath = directory + url

        function writeFile() {
            console.log('app:writeFile' + serverFilePath);
            fstream = fs.createWriteStream(serverFilePath);
            file.pipe(fstream);
            fstream.on('close', function () {
                // TODO add correct type
                if (acceptedImageExtensions.indexOf(extension) !== -1) {
                    res.status(200).send({file: url, name : fName, type: 'image/jpg'});
                } else {
                    res.status(200).send({file: url, name : fName, type: extension});
                }
                fileUploadCb(req.query.projectId, category, url);
            });
        }
        console.log('uploadFile', '/' + folder);
        mkdir(directory, '/' + folder, writeFile);
    });
});

module.exports = function (dirName, fileUploadCallback) {
    fileUploadCb = fileUploadCallback;
    directory = dirName;
    return router
};