/*jslint browser: true */
/**
 * handle the connection between server and client
 */
const canny = require('canny')
const events = require('./events.js')
const shoe = require('shoe')
const dnode = require('dnode')
const connectionLost = require('./uiModules/connectionLost/index.js')

window.domOpts = window.domOpts || require('dom-opts');

/**
 * Some of the callbacks are handled via the registered controller - addController method.
 */
var trade = (function () {
    "use strict";
    // ready queue call registered call backs when trade is ready
    var cbs = [],
        server,
        registeredController = [],
        // this flag should be true if there is a stable server connection
        hasServerConnection = false,
        tryToReconnect = false,
        connectionLostUi = connectionLost({
            onReload : () => location.reload(),
            onReconnect : () => {
                tryToReconnect = true
                connectionLostUi.showProgress()
                stream = shoe('/trade')
                createConnection((userObject, sessionsEnabled) => {
                    if (userObject === null) {
                        // this is the case when the session ends on server side
                        connectionLostUi.render('RECONNECT_FAIL')
                    } else {
                        connectionLostUi.destroy()
                        tryToReconnect = false
                    }
                })
            },
            onClose : () => {
                connectionLostUi.destroy()
            }
        })
    let stream = shoe('/trade')
    let d

    function init(s, fc) {
        server = s;

        if (server.setUserRights) {
            server.setUserRights(canny.cookieManager.forSessionCookie('translatron_session').getValues(), fc);
        } else {
            fc({name:'Logout', isAdmin: true}, false);
        }

        server.attachClientCallbacks(events.serverEvents);
        // call ready queue
        cbs.map(function (cb) {
            cb && cb();
            return null;
        });
    }

    function createConnection(fc) {
        d = dnode()
        d.on('remote', function (server) {
            hasServerConnection = true
            init(server, fc);
        })
        d.on('fail', function (err) {
            console.log(err)
            hasServerConnection = false
            connectionLostUi.render('CONNECTION_FAIL')
        })
        d.on('error', function (err) {
            console.log(err)
            // something happens
            // e.g. a UI update throws an exception
            hasServerConnection = false
            connectionLostUi.render('EXCEPTION', err.name)
        })
        d.on('end', function (err) {
            // this is called if the connection is closes from server
            hasServerConnection = false
            console.error('trade:end', err);
            // the setTimeout is for avoid flickering if page reload via e.g. F5
            if (tryToReconnect)
                connectionLostUi.render('RECONNECT_FAIL')
            else
                setTimeout(() => connectionLostUi.render('CONNECTION_END'), 1000)
        })
        d.pipe(stream).pipe(d);
    }
    /**
     * Check if connection is available - otherwise send view error
     * @returns {boolean}
     */
    function isConnected() {
        if (hasServerConnection)
            return true
        connectionLostUi.render('RECONNECT')
        return false
    }

    /**
     *
     * @param functionName the function to call
     * @param args an array of parameters which are passed to the function
     */
    function callController(functionName, args) {
        registeredController.forEach(function (controller) {
            if (controller.hasOwnProperty(functionName)) {
                try {
                    console.log('controller:', functionName)
                    controller[functionName].apply(null, args)
                } catch(e) {
                    connectionLostUi.render('FATAL', e.message)
                    console.error(e);
                }
            }
        });
    }

    return {
        initialize : function (fc) {
            createConnection(fc)
        },
        addController : function (obj) {
            registeredController.push(obj);
        },
        /**
         * Load the whole project files with all required data (project specific json)
         * @param {string} projectId
         * @param {function} cb
         */
        loadProject : function (projectId, cb) {
            server.loadProject(projectId, function (data, {id, name, url}) {
                if (data) {
                    // overwrite project id
                    data.projectId = id
                    data.project = name
                    callController('onLoadProject', [data, {id, name, url}]);
                    cb && cb(null, data, {id, name, url});
                } else {
                    // callback a error so the caller has the control about error handling
                    // TODO refactor code and make use of error object instead of false - and pass empty object to other args instead of nothing
                    cb && cb(false)
                }
            });
        },
        /**
         * actually same as saveKey but the internal controller call is different
         * @param projectId
         * @param language
         * @param keyAndValue
         * @param cb
         */
        createKey : function (projectId, language, keyAndValue, cb) {
            if (isConnected())
                server.saveKey(projectId, language, keyAndValue,
                    function(err, key, value) {
                        // TODO handle error case
                        if (!err) {
                            cb(projectId, language, key, value);
                            callController('onCreateKey', [projectId, language, key, value]);
                        }
                    })
        },
        /**
         *
         * @param projectId
         * @param {{id :string, sourceCategory:string, targetCategory:string}} keyAndValue
         * @param cb
         */
        cloneKey: function(projectId, keyAndValue, cb) {
            if (isConnected())
                server.cloneKey(projectId, keyAndValue,
                    function(err, projectId, data) {
                        cb(err, projectId, data)
                        callController('onKeyCloned', [projectId, data])
                    })
        },
        /**
         * Save changes to a key's value. Change will be broadcast to other clients.
         * @param {string} projectId
         * @param {string} language
         * @param {{key:string, value:string}} keyAndValue
         * @param {function} cb - callback to execute after saving
         */
        saveKey : function (projectId, language, keyAndValue, cb) {
            if (isConnected())
                server.saveKey(projectId, language, keyAndValue,
                    function(err, key, value) {
                        // TODO handle error case
                        if (!err) {
                            cb(projectId, language, key, value)
                        }
                    })
        },
        /**
         *
         * @param {string} projectName
         * @param currentDirId if of the directory in which the new project will be created
         */
        createNewProject : function (projectName, currentDirId) {
            if (isConnected())
                server.createNewProject(currentDirId, projectName, {},
                    function(err, projectData, project) {
                        // TODO handle error case
                        if (!err) {
                            callController('onNewProjectCreated', [projectData, project])
                        }
                    })
        },
        /**
         *
         * @param {string} directoryName
         * @param {string} currentDirectory
         */
        createNewDirectory : function(directoryName, currentDirectory) {
            if (isConnected())
                server.createNewDirectory(directoryName, currentDirectory,
                    function(err, directoryData) {
                        // TODO handle error case
                        if (!err) {
                            callController('onNewDirectoryCreated', [directoryData])
                        }
                    })
        },
        /**
         * Renames a category.
         * @param {string} projectId
         * @param {string} oldName
         * @param {string} newName
         */
        renameCategory : function (projectId, oldName, newName) {
            if (isConnected())
                server.renameCategory(projectId, oldName, newName,
                    function (err, oldName, newName) {
                        if (!err) {
                            callController('renameCategory', [oldName, newName])
                        }
                    })
        },
        /**
         * Removes a category with all it's child keys.
         * @param {string} projectId
         * @param {string} catName
         */
        removeCategory : function (projectId, catName) {
            if (isConnected())
                server.removeCategory(projectId, catName,
                    function (err, catName) {
                        if (!err) {
                            callController('removeCategory', [catName])
                        }
                    })
        },
        /**
         * Renames a key for all languages
         * @param {string} projectId
         * @param {{newKey: string, oldKey: string}} obj
         */
        renameKey : function (projectId, obj) {
            if (isConnected())
                server.renameKey(projectId, {
                    newKey : obj.newKey,
                    oldKey : obj.oldKey
                }, function (err, oldKey, newKey) {
                    if (!err) {
                        callController('renameKey', [oldKey, newKey])
                    } else {
                        callController('renameKey', [false])
                    }
                })
        },
        /**
         * Removes a key for all languages.
         * @param {string} projectId
         * @param {string} keyName
         * @param {function} cb
         */
        removeKey : function (projectId, keyName, cb) {
            if (isConnected())
                server.removeKey(projectId, keyName,
                    function (err, keyName) {
                        if (!err) {
                            cb(keyName)
                            callController('removeKey', [keyName])
                        }
                    })
        },
        /**
         *
         * @param {string} projectId
         * @param {string} categoryName
         */
        removeImage : function(projectId, categoryName) {
            if (isConnected())
                server.removeImage(projectId, categoryName, function (err, categoryName) {
                    if (!err) {
                        callController('imageRemoved', [categoryName])
                    } else {
                        toast.showMessage(err.message)
                    }
                })
        },
        /**
         *
         * Get the contents of the directory.
         *
         * @param dir the selected directory.
         * @param cb {projects:[String]:dirs:[String]}
         */
        getDirectory : function (dir, cb) {
            if (isConnected())
                server.getDirectory(dir,
                    function (err, args) {
                        if (err !== null) {
                            toast.showMessage('Internal server error! Please report this message to a developer: ' + err.message)
                            console.error(err.message)
                            return
                        }
                        // only call the controller if not false
                        cb && cb(args)
                        if (args !== false) {
                            callController('getDirectory', [args])
                        }
                    })
        },
        /**
         * save the project description
         * @param projectId
         * @param id
         * @param description
         * @param callback
         */
        saveProjectDescription : function(projectId, id, description, callback) {
            if (isConnected())
                server.saveProjectDescription(projectId, id, description,
                    function(err) {
                        if (!err) {
                            callback && callback(true)
                            callController('savedProjectDescription', [])
                        } else {
                            callback && callback(false)
                        }
                    })
        },
        /**
         * Move a project. Can be used for:
         *  * move project
         *  * rename project
         *
         * @param {string} id
         * @param {string} url - the new URL (optional)
         * @param {string} name - the new name (optional)
         * @param {function} cb - callback will be called
         */
        moveProject : function ({id, url, name}, cb) {
            if (isConnected()) {
                server.moveProject({id, url, name}, (err, project) => {
                    cb(err, project || {})
                })
            }
        },
        /**
         * TODO summarize projectName + currentDirId to one projectId
         * Delete a project.
         * @param projectName
         * @param currentDirId - @deprecated
         * @param callback
         */
        deleteProject : function (id, cb) {
            if (isConnected()) {
                server.deleteProject(id,
                    function (err, project) {
                        if (!err) {
                            // TODO change to: prjName
                            cb && cb(null, project)
                            callController('projectDeleted', [project])
                        } else {
                            cb && cb(err)
                        }
                    })
            }
        },
        /**
         * Delete a project.
         * @param dirName
         * @param currentDirId
         * @param callback
         */
        deleteFolder : function (id, callback) {
            if (isConnected())
                server.deleteFolder(id,
                    function (err, dirId) {
                        if (!err) {
                            callback && callback(null, dirId)
                            callController('folderDeleted', [dirId])
                        } else {
                            callback && callback(err)
                        }
                    })
        },
        // Not really tested
        ready : function (cb) {
            if (server) {
                cb();
            } else {
                cbs.push(cb);
            }
        }
    };
}());

module.exports = trade;