/**
 * Reads a project JSON and returns the data as raw file format back to the client
 */
var express = require('express'),
    router = express.Router(),
    parser = require('../unicode-parser'),
    dao,
    filters = {
        lang: require('./filters/langFilter'),
        category: require('./filters/categoryFilter')
    };

function stringify(keysObject) {
    var bundle = '';
    Object.keys(keysObject).forEach((key) => {
        var value = keysObject[key];
        bundle += key.toString() + '=' + parser.escapeUnicode(value.toString()) + '\n';
    });
    return bundle;
}

router.get(/.?\/(\w|-)+\.json/, function(req, res) {
    console.log('jsonExporter:path', req.query);
    var projectId = req.path.replace('.json', '').replace('/', ''),
        query = req.query;

    // return the project as JSON
    dao.loadProject(projectId, function(json, {id, name, url, file}) {
        var obj = {};
        if (json) {
            Object.keys(json.keys).forEach(function(lang) {
                obj[lang] = {};
                Object.keys(json.keys[lang]).forEach(function(key) {
                    let text = json.keys[lang][key]
                    if (lang === 'fr')  {
                        while (/ \!/.test(text)) {
                            text = text.replace(' !', ' !');
                        }
                        while (/ \?/.test(text)) {
                            text = text.replace(' ?', ' ?');
                        }
                    }
                    obj[lang][key] = parser.escapeUnicode(text);
                });
            });

            // Check query parameters and apply corresponding filters
            for (var key in query) {
                if (query.hasOwnProperty(key) && filters.hasOwnProperty(key)) {
                    obj = filters[key].filter({
                        json: obj,
                        paramValue: query[key]
                    });
                }
            }

            res.set('Content-Type', 'application/json');
            res.set('Access-Control-Allow-Origin', '*');
            console.log('jsonExporter:obj', obj);
            var s = JSON.stringify(obj, null, 2);
            console.log('jsonExporter:s', s);
            // while s contains double slash remove them all
            while (/\\\\/.test(s)) {
                s = s.replace('\\\\', '\\');
            }
            res.send(s);
        } else {
            res.status(404).send('Project ' + projectId + ' not found');
        }
    })
});

module.exports = function(dataAccessObject) {
    dao = dataAccessObject;
    return router
};