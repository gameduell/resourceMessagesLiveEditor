/*global console */
/*jslint node: true */

function run(configuration) {
    var config = configuration || {};

    var projectFolder = (config.hasOwnProperty('fileStorage') ? config.fileStorage.projectFiles || __dirname + '/static/translations' : __dirname + '/static/translations'),
        projectJSON = (config.hasOwnProperty('fileStorage') ? config.fileStorage.projectJSON || projectFolder + '/project.json' : projectFolder + '/project.json'),
        uploadFolder = (config.hasOwnProperty('fileStorage') ? config.fileStorage.images || __dirname + '/dist/upload' : __dirname + '/dist/upload'),
        mkdir = require('./lib/server/mkdir-p');

    // create required folders:
    mkdir('/', uploadFolder);
    mkdir('/', projectFolder);

    var packageJSON = require('./package.json'),
        express = require('express'),
        shoe = require('shoe'),
        dnode = require('dnode'),
        dao = require('./lib/server/dao.js')({projectFolder, uploadFolder, projectJSON}),
        fileManager = require('./lib/server/legacy/fileManager.js')(projectFolder),
        serverPort = config.port || (packageJSON.config.port || 3000),
        enableAuth = packageJSON.config.enableAuth,
        pug = require('pug'),
        cookieParser = require('cookie-parser'),
        bodyParser = require('body-parser'),
        changesNotifier = require('./lib/server/changesNotifier.js')(),
        busboy = require('connect-busboy'),
        operations = require('./lib/server/operations.js')(dao, changesNotifier, config.auth);

    var app = express();
    
    // initialize the dao object - it's required to do this asynchronous because of the projectHandler
    dao.init()
        .catch(err => console.log(err))

    enableAuth = config.hasOwnProperty('auth');

    // use bodyParser middleware for handling request bodies (express does *not* provide that feature out-of-the-box).
    // since we only have one case of that (POST to /login where username, password are in the body) and that one is url-encoded,
    // we only need that flavor of bodyParser. about the "extended" property, see https://github.com/expressjs/body-parser#bodyparserurlencodedoptions
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    // same for parsing cookie
    app.use(cookieParser());

    app.use(busboy());

    // activate the LDAP auth
    if (enableAuth) {
        app.use(require('./lib/server/auth')(app, config.auth))
        app.use(require('./lib/server/middleware/touchSession'))
    }

    app.use(function (req, res, next) {
        console.log(req.method, req.url, req.query, req.user ? req.user.name : '-');
        next();
    });

    // configure routes for static content
    if (config.translatronUi) {
        app.use('/js',
            express.static(__dirname + '/node_modules/@eightyfour84/translatron-ui/dist/js'));
        app.use('/css',
            express.static(__dirname + '/node_modules/@eightyfour84/translatron-ui/dist/css'));
        app.use('/img',
            express.static(__dirname + '/node_modules/@eightyfour84/translatron-ui/dist/img'));
    } else {
        app.use('/dist',
            express.static(__dirname + '/dist'));
    }

    app.use('/images',
        express.static(uploadFolder));
    app.use('/bower_components',
        express.static(__dirname + '/bower_components'));

    app.use(require('./lib/server/middleware-importer/upload')(uploadFolder, function (folder, key, fName) {
        operations.addImage(folder, key, fName);
    }));
    app.use(require('./lib/server/middleware-importer/uploadJMBF')(operations.saveBundle));
    app.use(require('./lib/server/middleware-importer/importJSON')(operations.importJSON));
    
    /*
        The main router handles all URLs for viewing/editing projects/directories and the export routes
     */
    var mainRouter = express.Router();
    mainRouter.use(require('./lib/server/middleware/usersOnline'));
    // TODO add middleware to mainRouter which will check if a project or directory with that id exists
    mainRouter.use(require('./lib/server/middleware-exporter/jpmbfExporter')(dao));
    mainRouter.use(require('./lib/server/middleware-exporter/jsonExporter')(dao));
    mainRouter.get('*', (req, res) => {
        if (config.translatronUi) {
            res.header('version', packageJSON.version)
            res.sendFile(__dirname + '/node_modules/@eightyfour84/translatron-ui/dist/index.html')
        } else {
            res.send(pug.compileFile(__dirname + '/lib/client/pug/index.pug')({
                version: packageJSON.version
            }));
        }
    });

    var toLoginIfUnauthenticated = function (req, res, next) {
        if (!/\.json/.test(req.path) && !/\.properties/.test(req.path) && enableAuth && !req.user) {
            // TODO sending the login page only makes sense for browser requests. if anybody is e.g. using curl to
            // retrieve message bundles, we should only return a 401 but no content
            res.status(401).send(pug.compileFile(__dirname + '/lib/client/pug/login.pug')());
        } else {
            next();
        }
    };
    app.get(/\/(?:\w\/)*(?:\w+\.\w+)?/, toLoginIfUnauthenticated, mainRouter);

    // catch-all route + handler if no route matched, just return 404
    app.all('*', (req, res) => {
        res.status(404).send('Not found');
    });

    var server = app.listen(serverPort);

    var websocketServer = shoe(function (stream) {
        "use strict";

        var d = dnode(operations);

        // handle errors from processing commands from clients: at least log them
        // if we didn't have this error handler, errors would propagate up the stack and effectively close down the
        // application
        d.on('error', (err) => {
            console.error(err.message, err.stack);
        });
        d.on('end', () => {
            operations.detachClientCallbacks();
        });

        d.pipe(stream).pipe(d);
    });
    // "/trade" identifies the websocket connection
    websocketServer.install(server, '/trade');

    console.log("start server ", serverPort);
}

console.log('app:__dirname', __dirname);

module.exports = run;