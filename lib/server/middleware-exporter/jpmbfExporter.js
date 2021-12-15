/**
 * Reads a project JSON and returns the data as raw file format back to the client
 */
var express = require('express'),
    router = express.Router(),
    parser = require('../unicode-parser'),
    dao;

function keysToMessageBundle(keysObject, lang) {
    var bundle = '';
    Object.keys(keysObject).forEach((key) => {
        var value = keysObject[key];
        if (lang === 'fr')  {
            while (/ \!/.test(value)) {
                value = value.replace(' !', ' !');
            }
            while (/ \?/.test(value)) {
                value = value.replace(' ?', ' ?');
            }
        }
        bundle += key.toString() + '=' + parser.escapeUnicode(value.toString()) + '\n';
    });
    return bundle;
}

router.get(/.?\/(\w|-)+\.properties/, function(req, res) {
    var projectId = req.path.replace('.properties', '').replace('/', ''),
        // TODO read default language from main project config
        lang = req.query.lang || 'en';
    dao.loadProject(projectId, function (projectData, {id, name, url, file}) {
        if (projectData) {
            if (projectData.keys.hasOwnProperty(lang)) {
                res.set('Content-Type', 'text/plain');
                res.send(keysToMessageBundle(projectData.keys[lang], lang));
            } else {
                res.status(404).send('# No keys have been defined for ' + lang);
            }
        } else {
            res.status(404).send('Project ' + projectId + ' not found');
        }
    });
});

module.exports = function (dataAccessObject) {
    dao = dataAccessObject;
    return router;
};