var express = require('express'),
    router = express.Router(),
    importJsonCallback;

router.post('/importJSON', function(req, res) {
    var projectId = req.query.projectId;

    req.pipe(req.busboy);
    req.busboy.on('file', function(fieldname, file, info) {
        var string = '';

        file.on('data', function(data) {
            string += data.toString();
        });

        file.on('end', function() {
            try {
                importJsonCallback(projectId, JSON.parse(string), function(err, projectId, projectData) {
                    var result = {
                            success: !err,
                            projectId: projectId,
                            msg: !err ? 'Imported JSON successfully' : err.message
                        },
                        status = !err ? 200 : 406;
                    res.status(status).send(result);
                });
            } catch (err) {
                res.set({
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                });
                res.status(406).send({success: false, msg: err.message, projectId: projectId});
            }
        });

    });
});

module.exports = function(cb) {
    importJsonCallback = cb;
    return router
};