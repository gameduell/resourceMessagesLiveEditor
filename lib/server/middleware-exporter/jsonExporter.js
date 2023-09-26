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
                    // we don't unicode escape the texts anymore - the client is decoding it again
                    // again and this makes this step obsolete
                    // obj[lang][key] = parser.escapeUnicode(text);
                    obj[lang][key] = text;
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
            // console.log('jsonExporter:obj', obj);
            var s = JSON.stringify(obj, null, 2);
            // console.log('jsonExporter:s', s);

            // We don't want: "\\u00e9" in json exporter (double escaped unicode) but allow "\\|" !
            // We need to correct them! (Escaped as string we will get four backslashes here):
            // So following text string: 
            //     "...ie is be\\\\u00ebindigt car \\\\| cars"
            // should be after regex:
            //     "...ie is be\\u00ebindigt car \\\\| cars"
            // means: 4 back slash will be replaced to "\\" but not "\\\\|" 
            // So in jsonExporter we should get "...ie is be\u00ebindigt car \\| cars"
            // Legacy: the unicode escaping is required for backward compatibility where special
            // characters saved as unicode in the project json.
            // It ends up in this wonderful expression: 
            s = s.replace(/(?!\\\\\|)\\\\(?!\\\|)/g, "\\");
            // }
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