var express = require('express'),
    router = express.Router(),
    fs = require('fs'),
    saveBundle;

// takes the content of a properties file and returns it as json
function convertPropertiesToJson(data) {
    var asJson = {};
    // parse every line and store key-value-pairs as json
    data.split('\n').forEach(function(line) {
        var splitted;
        // skip comments and empty strings
        if (line.indexOf('#') === -1 && line.length > 2) {
            splitted = line.split('=');
            // prototype
            asJson[splitted[0]] = splitted[1];
        }
    });
    return asJson;
}

function getLanguage(fileName) {
    var lang = fileName.split('.')[0].split('_'),
        retLang = lang.length === 2 ? lang[1] : lang.length === 3 ? lang[1] + '_' + lang[2] : undefined;
    return retLang; 
}

router.post('/uploadJMBFFile',  function (req, res) {
    var fstream, projectId = req.query.projectId, key = req.query.key, project = req.query.project;

    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, info) {
        // replace all spaces with underscores and prefix it with the project name
        // var fName = project + '_' + info.filename.split(' ').join('_');
        var string = '';
        console.log('uploadJMBF:folder', projectId); // /sub/sub1
        console.log('uploadJMBF:project', project); // sub1
        console.log('uploadJMBF:filename', info.filename); // messages.properties

        file.on('data', function(data) {
            string += data.toString();
        });
        file.on('end', function() {
            var asJSON = convertPropertiesToJson(string);
            saveBundle(projectId, getLanguage(info.filename), asJSON, function (success) {
                if (success) {
                    res.status(200).send({projectId: projectId});
                } else {
                    res.status(406).send({projectId: projectId});
                }
            });

        });

    });
});

module.exports = function (saveBundleCb) {
    saveBundle = saveBundleCb;
    return router
};