const sessionStore = require('./sessionStore')
const cookieParser = require('cookie-parser')
const ERRORS = require('../ERRORS')

/**
 * A client's interface to the backend API, instantiated on a per client base. To receive notifications about operations
 * by other clients, use attachClientCallbacks.
 * @param dao
 * @param changesNotifier
 * @param authConfig
 * @param searchConfig
 * @returns {{loadProject: loadProject, saveKey: saveKey, renameKey: renameKey, removeKey: removeKey, createNewProject: createNewProject, getDirectory: getDirectory, createNewDirectory: createNewDirectory, attachClientCallbacks: attachClientCallbacks, detachClientCallbacks: detachClientCallbacks, saveProjectDescription: saveProjectDescription, searchTerm: searchTerm}}
 */
module.exports = function (dao, changesNotifier, authConfig, searchConfig) {
    'use strict'

    var clientListenerId = Math.trunc(Math.random() * Math.pow(10, 10)),
        hasAdminRights = true,
        api = {
            loadProject: function (projectId, cb) {
                dao.loadProject(projectId, cb)
            },
            importJSON: function (projectId, data, cb, preventOverride) {
                dao.importJSON(
                    projectId,
                    data,
                    (err, projectId, projectData) => {
                        if (!err) {
                            cb(null, projectId, projectData)
                            changesNotifier.notify(
                                'jsonImported',
                                [projectId, projectData],
                                clientListenerId
                            )
                        } else {
                            cb(err, projectId, projectData)
                        }
                    },
                    preventOverride
                )
            },
            saveKey: function (projectId, language, keyAndValue, cb) {
                dao.saveKey(
                    projectId,
                    language,
                    keyAndValue,
                    (err, keyName, keyValue) => {
                        if (!err) {
                            cb(null, keyName, keyValue)
                            changesNotifier.notify(
                                'keyUpdated',
                                [projectId, language, keyName, keyValue],
                                clientListenerId
                            )
                        } else {
                            cb(err)
                        }
                    }
                )
            },
            cloneKey: function (projectId, keyAndValue, cb) {
                dao.cloneKey(projectId, keyAndValue, (err, projectId, data) => {
                    if (!err) {
                        cb(null, projectId, data)
                        changesNotifier.notify(
                            'onKeyCloned',
                            [projectId, data],
                            clientListenerId
                        )
                    } else {
                        cb(err)
                    }
                })
            },
            saveBundle: function (projectId, language, obj, cb) {
                dao.saveBundle(projectId, language, obj, (err, success) => {
                    if (err !== null) {
                        cb(null)
                        // TODO think about this... will be a lot of notifications if we do this for each key - maybe a new event would be better
                        // changesNotifier.notify('keyUpdated', [projectId, language, keyName, keyValue], clientListenerId);
                    } else {
                        cb(success)
                    }
                })
            },
            renameKey: function (projectId, renameData, cb) {
                dao.renameKey(
                    projectId,
                    renameData,
                    (err, oldKeyName, newKeyName) => {
                        if (!err) {
                            cb(null, oldKeyName, newKeyName)
                            changesNotifier.notify(
                                'keyRenamed',
                                [projectId, oldKeyName, newKeyName],
                                clientListenerId
                            )
                        } else {
                            cb(err)
                        }
                    }
                )
            },
            removeKey: function (projectId, keyName, cb) {
                dao.removeKey(projectId, keyName, (err) => {
                    if (!err) {
                        cb(null, keyName)
                        changesNotifier.notify(
                            'keyDeleted',
                            [projectId, keyName],
                            clientListenerId
                        )
                    } else {
                        cb(err)
                    }
                })
            },
            /**
             * On success, this function will do a broadcast of 'newProjectWasCreated', with projectId as the payload.
             * @param path
             * @param projectName
             * @param obj default values for the project (as now of, only 'description' is supported)
             * @param cb
             */
            createNewProject: function (path, projectName, obj, cb) {
                dao.createNewProject(
                    path,
                    projectName,
                    obj,
                    (err, projectData, project) => {
                        if (!err) {
                            cb(null, projectData, project)
                            changesNotifier.notify(
                                'newProjectWasCreated',
                                [projectData.projectId],
                                clientListenerId
                            )
                            dao.invalidateSearch()
                        } else {
                            cb(err)
                        }
                    }
                )
            },
            getDirectory: function (dir, cb) {
                dao.getDirectory(dir, cb)
            },
            /**
             *
             * @param directoryName
             * @param path
             * @param cb a callback function where first parameter is an optional error and 2nd parameter of directory data
             * (see dao.createNewDirectory) if successful.
             */
            createNewDirectory: function (directoryName, path, cb) {
                dao.createNewDirectory(
                    directoryName,
                    path,
                    (err, directoryData) => {
                        if (!err) {
                            cb(null, directoryData)
                            changesNotifier.notify(
                                'newDirectoryCreated',
                                [directoryData.directoryId],
                                clientListenerId
                            )
                        } else {
                            cb(err)
                        }
                    }
                )
            },
            /**
             * initial call - all client methods are saved here.
             * returns the client listener id
             * @param clientsideCallbacks
             * @returns {*}
             */
            attachClientCallbacks: function (clientsideCallbacks) {
                changesNotifier.addListener(
                    clientListenerId,
                    clientsideCallbacks
                )
                return clientListenerId
            },
            /**
             * Call when the connection to client closes, changesNotifier will no longer send updates to that client.
             */
            detachClientCallbacks: function () {
                changesNotifier.removeListener(clientListenerId)
            },
            /**
             *
             * @param projectId
             * @param description
             * @param id
             * @param callback a callback function, will be called without any arguments on success and with Error parameter
             * on failure.
             */
            saveProjectDescription: function (
                projectId,
                id,
                description,
                callback
            ) {
                dao.saveProjectDescription(
                    projectId,
                    id,
                    description,
                    (err) => {
                        if (!err) {
                            callback()
                            changesNotifier.notify(
                                'projectDescriptionUpdated',
                                [projectId, id, description],
                                clientListenerId
                            )
                        } else {
                            callback(err)
                        }
                    }
                )
            },
            addImage: function (projectId, id, fileName) {
                dao.addImage(projectId, id, fileName, (err) => {
                    if (!err) {
                        changesNotifier.notify(
                            'addImage',
                            [projectId, id, fileName],
                            clientListenerId
                        )
                    }
                })
            },
            removeImage: function (projectId, categoryName, cb) {
                dao.removeImage(projectId, categoryName, (err) => {
                    if (!err) {
                        cb(null, categoryName)
                        changesNotifier.notify(
                            'imageRemoved',
                            [projectId, categoryName],
                            clientListenerId
                        )
                    } else {
                        cb(err)
                    }
                })
            },
            renameCategory: function (projectId, oldName, newName, cb) {
                dao.renameCategory(projectId, oldName, newName, (err) => {
                    if (!err) {
                        cb(null, oldName, newName)
                        changesNotifier.notify(
                            'categoryRenamed',
                            [projectId, oldName, newName],
                            clientListenerId
                        )
                    } else {
                        cb(err)
                    }
                })
            },
            removeCategory: function (projectId, catName, cb) {
                dao.removeCategory(projectId, catName, (err) => {
                    if (!err) {
                        cb(null, catName)
                        changesNotifier.notify(
                            'categoryDeleted',
                            [projectId, catName],
                            clientListenerId
                        )
                    } else {
                        cb(err)
                    }
                })
            },
            moveProject: function ({ id, url, name }, cb) {
                if (!hasAdminRights) {
                    cb({
                        error: ERRORS.NO_PERMISSION,
                        message: 'Not allowed to perform this action.',
                    })
                    return
                }
                dao.moveProject({ id, url, name }, (err, data) => {
                    if (!err) {
                        cb(null, data)
                        dao.invalidateSearch()
                    } else {
                        cb(err)
                    }
                })
            },
            deleteProject: function (projectId, cb) {
                if (!hasAdminRights) {
                    cb(new Error('Not allowed to perform this action.'))
                    return
                }

                dao.deleteProject(projectId, (err, project) => {
                    if (!err) {
                        cb(null, project)
                        changesNotifier.notify(
                            'projectDeleted',
                            [project.id],
                            clientListenerId
                        )
                        dao.invalidateSearch()
                    } else {
                        cb(err)
                    }
                })
            },
            /**
             *
             * @param {*} id
             * @param {*} dirName @deprecated
             * @param {*} cb
             */
            deleteFolder: function (id, cb) {
                dao.deleteFolder(id, (err) => {
                    if (!err) {
                        cb(null, id)
                        changesNotifier.notify(
                            'folderDeleted',
                            [id],
                            clientListenerId
                        )
                    } else {
                        cb(err)
                    }
                })
            },
            getTableOfContents: function (cb) {
                return dao.getTableOfContents(function (err, data) {
                    if (!err) {
                        cb(null, data)
                    } else {
                        cb(err)
                    }
                })
            },
            copyProject: function (targetProject, project2Copy, callback) {
                return dao.copyProject(
                    targetProject,
                    project2Copy,
                    function (err, projectId, projectData) {
                        if (!err) {
                            callback(
                                null,
                                'Project import was a great success'
                            )
                            changesNotifier.notify(
                                'jsonImported',
                                [projectId, projectData],
                                clientListenerId
                            )
                        } else {
                            callback(true, projectId, projectData)
                        }
                    }
                )
            },
        }

    if (searchConfig && searchConfig.socket) {
        api.searchTerm = function (searchTerm, cb) {
            dao.searchTerm(searchTerm, (err, results) => {
                if (!err) {
                    cb(null, results)
                } else {
                    cb(err)
                }
            })
        }
    }

    if (authConfig) {
        api.setUserRights = function (sessionCookie, fc) {
            var sid = cookieParser.signedCookie(
                sessionCookie,
                authConfig.secret
            )
            if (sid) {
                sessionStore.get(sid, function (err, session) {
                    if (err || !session) {
                        console.log('operations:error no session for this user')
                        fc(null)
                    } else {
                        hasAdminRights = session.isAdmin
                        fc(
                            {
                                name: session.fullName,
                                isAdmin: session.isAdmin,
                            },
                            true
                        )
                    }
                })
            }
        }
    }

    return api
}
