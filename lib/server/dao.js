const fileManagerObj = require('./legacy/fileManager')
const fs = require('fs')
const mkdir = require('./mkdir-p/mkdir-p')
const ProjectHandler = require('./lib/ProjectHandler')
const path = require('path')
const ERRORS = require('../ERRORS')

/**
 * Template for new project configs.
 * @type {{description: string, numberOfKeys: number, defaultLanguage: string, availableLanguages: string[], languages: {}, keys: {}, keyDescriptions: {}}}
 */
var projectConfigTemplate = {
    description: '',
    // TBD compute on the fly? if not possible, add explanation why
    numberOfKeys: 0,
    defaultLanguage: 'en',
    /**
     * The list of languages supported/allowed for a project
     */
    availableLanguages: [
        "en",
        "de",
        "fr",
        "es",
        "nl",
        "da",
        "sv",
        "en_GB"
    ],
    // Each property is a language and has one property "translated" which is the number of translated keys for that language
    // TBD do we really need this? wouldn't we be faster if we computed that on the fly? Or are there any other concerns
    // which make this necessary?
    languages: {},
    /**
     * The translated keys. keys are properties, their values are maps where keys are i18n keys and values are the translations
     * for the language.
     */
    keys: {},
    /**
     * TODO describe this structure
     */
    keyDescriptions: {
        "__description": ""
    },
    /**
     * Images resp. relative paths to image uploads
     * accessible via user-defined key
     */
    images: {}
};

/**
 *
 * @param projectName
 * @param obj Optional object with
 */
function createInitialProjectConfig(projectName, obj) {
    var projectObj = {};
    Object.assign(projectObj, projectConfigTemplate);
    // TODO remove this - it's not part anymore of this file
    projectObj.project = projectName;
    projectObj.description = obj && obj.description || projectConfigTemplate.description;
    return projectObj;
}

/**
 * Calculates the parent directory structure and returns them as array
 *
 * The first element is the root - with a / as id and no name.
 *
 * @param dir
 * @returns {Array|string}
 */
function getParentDirs(dir) {
    var d = dir.split('/'),
        idx = d.length,
        ret = [];

    for (var i = 0; i < d.length; i++, idx++) {
        var obj = {id: d.slice(0, i + 1).join('/'), name: d[i]};
        if (i === 0 && obj.id === '') {
            obj.id = "/";
            obj.name = "";
            ret.push(obj);
        }
        if (obj.id !== '/') {
            ret.push(obj);
        }
    }
    return ret;
}

/**
 * Creates new key holding copied value from given old key
 * @param keysObj - Object containing keys for various languages (in objects) or key/value pairs
 * @param oldKey - Id for the key whose value will be stored in newly created key
 * @param newKey - Id for the key to be created
 * @returns {number}
 */
function renameKeyForObject(keysObj, oldKey, newKey) {
    var keysFound = 0;
    Object.keys(keysObj).forEach((item) => {
        // Object carrying objects (e.g. de, en, fr etc.)
        if (keysObj[item].hasOwnProperty(oldKey)) {
            keysObj[item][newKey] = keysObj[item][oldKey];
            delete keysObj[item][oldKey];
            keysFound++;
        // Flat object containing strings (e.g. in keyDescriptions)
        } else if (item === oldKey) {
            keysObj[newKey] = keysObj[item];
            delete keysObj[item];
            keysFound++;
        }
    });
    return keysFound;
}

/**
 * Clone / rename key descriptions
 * @param data - Object holding key descriptions to iterate over
 * @param oldKey - Id of the source key to clone
 * @param newKey - Id of the new key
 * @param deleteOld - Boolean to indicate whether to delete the old key
 */
function cloneKeyDescription(data, oldKey, newKey, deleteOld) {
    if (data.hasOwnProperty(oldKey)) {
        data[newKey] = data[oldKey];
        if (deleteOld) {
            delete data[oldKey];
        }
    }
}
/**
 * Invalidates and retrieves key/value pair data via key name from translations object
 *
 * Checks if given data is compliant with Translatron projects' data structure
 * Checks if the field contains rather an object than just a stringor number and
 * - in case - processes it's children to into Translatron compatible data format
 *
 * @param data
 * @returns {TypeError|object}
 */
function getTranslationsForKey(data) {
    var key = data.key,
        uploadedKeys = data.uploadedKeys,
        value = uploadedKeys[key],
        result = {};

    if (key.indexOf('_') === -1) {
        switch (typeof value) {
            // Not supported as key should at least have a category
            case 'string':
                return new TypeError(`Key '${key}' not compatible with Translatron project, has to provide both category and key id.`);
                break;
            // If translation texts are contained by category objects (json) break it up
            // and store them as Translatron internally used format
            case 'object':
                for (var childKey in value) {
                    if (value.hasOwnProperty(childKey)) {
                        result[`${key}_${childKey}`] = uploadedKeys[key][childKey];
                    }
                }
                break;
        }
    } else {
        result[key] = uploadedKeys[key];
    }
    return result;
}

/**
 *
 * @param projectFolder - the full path of the directory where projects files are saved.
 * @param uploadFolder
 * @param projectJSON
 * @returns {{loadProject: loadProject, createNewProject: createNewProject, createNewDirectory: createNewDirectory, saveProjectDescription: saveProjectDescription, renameCategory: renameCategory, removeCategory: removeCategory, deleteProject: deleteProject, deleteFolder: deleteFolder, saveKey: saveKey, cloneKey: cloneKey, saveBundle: saveBundle, importJSON: importJSON, renameKey: renameKey, removeKey: removeKey, getDirectory: getDirectory, addImage: addImage, removeImage: removeImage, setupClient: setupClient}}
 */
var dao = function({projectFolder, uploadFolder, projectJSON}) {
    
    const projectHandler = ProjectHandler({projectFolder, projectJSON})
    
    // a simple call to statSync will already throw an error if the directory does not exist
    if (!fs.statSync(projectFolder).isDirectory()) {
        throw new Error('dao.projectFolder ' + projectFolder + ' is not a directory');
    }

    var fileManager = fileManagerObj(projectFolder);

    /**
     *
     * @param path
     * @returns {XML|void|string|*}
     */
    function computeIdFromPath(path) {
        var s = path;
        // while // remove al double slashes
        while (/\/\//.test(s)) {
            s = path.replace('//', '/');
        }
        // remove .json extension from file if exists
        return s.replace('.json', '');
    }
    
    /**
     * Persist a project as a file below "projectFolder". "data" should be complete and well-formed (especially
     * the projectId).
     * Please note: this function will overwrite an existing file without warning!
     *
     * @param data
     * @param id
     * @param name
     * @param url
     * @param file
     * @param callback - will be called with either "true" if project file was written successfully, "false" otherwise.
     */
    function writeProjectConfigFile({data, id, name, url, file}, callback) {
        const stringifiedProject = JSON.stringify(data, null, 2);
        fs.writeFile(projectFolder + file, stringifiedProject, (err) => {
            if (err) {
                console.warn('Error writing project file', data, ':', err);
                callback(err);
            } else {
                callback();
            }
        });
    }

    return {
        /**
         * Initialize the dao
         * @returns {*}
         */
        init: () => projectHandler.init({projectJSON, projectFolder}),
        /**
         * Loads the whole project json file
         *
         * @param projectId
         * @param cb
         */
        loadProject: function(projectId, cb) {
            // TODO continue load from projecthandler
            projectHandler.read()
                .then(projects => {
                    if (!projects.projects[projectId])
                        throw projectId + ' does not exist'
            
                    return projects.projects[projectId]
                })
                .then(({name, url, file}) => {
                    return new Promise((resolve, reject) => {
                        fs.readFile(path.normalize(projectFolder + '/' +  file), 'utf8', (err, dataString) => {
                            if (err)
                                reject(err)
                            else
                                resolve({id: projectId, name, url, file, dataString})
                        })
                    });
                })
                .then(({id, name, url, file, dataString}) => {
                    return {
                        id, name, url, file, data: JSON.parse(dataString)
                    }
                })
                .then(({id, name, url, file, data}) => {
                    !data.availableLanguages && (data.availableLanguages = projectConfigTemplate.languages)
                    cb(data, {id, name, url, file})
                })
                .catch(function(err) {
                    console.log(err)
                    // TODO return more specific message
                    cb(false, {})
                })
        },
        /**
         *
         * Creates a new [project name].json from the default template (see projectConfigTemplate).
         *
         * @param parentDirectory
         * @param projectName (without .json appendix)
         * @param obj
         * @param cb a callback function called with an optional error and the projectData
         */
        createNewProject: function(parentDirectory, projectName, obj, cb) {
            // remove last slash if has one
            if (parentDirectory[parentDirectory.length - 1] === '/')
                parentDirectory = [...parentDirectory].slice(0,-1).join('')
            // create the id - will be file name and identifier in project.json
            const id = 'tr' + (new Date()).getTime()
            
            // TODO create project in project.json with unique timestamp
            projectHandler.read()
                .then((projectsJSON) => {
                    if (projectsJSON.projects[parentDirectory + projectName])
                        throw 'Project already exists'
                    
                    const newProject = {
                        name : projectName,
                        url : parentDirectory,
                        file : '/' + id + '.json'
                    }
                    
                    projectsJSON.projects[id] = newProject
                    
                    return projectHandler.save(projectsJSON).then(() => {
                        const projectData = createInitialProjectConfig(projectName, obj)
                        return new Promise((resolve => {
                            writeProjectConfigFile({
                                data: projectData,
                                id: parentDirectory + projectName,
                                name : newProject.name,
                                url : newProject.url,
                                file : newProject.file
                            }, (err) => {
                                if (!err)
                                    resolve({projectData, newProject});
                                else
                                    throw err
                            });
                        }))
                    })
                })
                .then(({projectData, newProject}) => cb(null, projectData, {
                    id : id,
                    name : newProject.name,
                    url : newProject.url,
                    file : newProject.file // it's only relevant for the unit test - it's not relevant for the UI
                }))
                .catch(err =>  cb(err))
        },
        /**
         *
         * @param directoryName
         * @param parentDirectory
         * @param cb a callback function
         */
        createNewDirectory: function(directoryName, parentDirectory, cb) {
            var fullParentDirPath = path.normalize(projectFolder + '/' + parentDirectory);
            var fullPath = fullParentDirPath + '/' + directoryName;
            console.log('dao.createNewDirectory: request to create ' + fullPath);

            // let's do the checks if directories exists/don't exist synchronously, these are quick operations.
            // if we'd do all of this asynchronously, we would need to have a overcomplicated callback hierarchy
            if (!fs.existsSync(fullParentDirPath)) {
                console.error('dao.createNewDirectory: cannot create directory ' + fullPath + ', parent directory does not exist');
                cb(new Error(fullParentDirPath + ' does not exist'));
                return;
            }

            if (fs.existsSync(fullPath)) {
                console.error('dao.createNewDirectory: cannot create directory ' + fullPath + ', exists already');
                cb(new Error(`${parentDirectory}/${directoryName} already exists!`));
                return;
            }

            fs.mkdir(fullPath, function(exception) {
                if (exception) {
                    console.error('dao.createNewDirectory: error creating directory ' + fullPath + ': ' + exception);
                    cb(exception);
                } else {
                    console.log('dao.createNewDirectory: ' + fullPath + ' created');
                    cb(null, {
                        directoryId: path.normalize(parentDirectory + '/' + directoryName),
                        parentDirectoryId: parentDirectory
                    });
                }
            });
        },
        /**
         *
         * @param projectId
         * @param id
         * @param description
         * @param callback
         */
        saveProjectDescription: function(projectId, keyId, description, callback) {
            this.loadProject(projectId, (projectData, {id, name, url, file}) => {
                if (!projectData) {
                    var msg = ['Project', projectId, 'does not exist, cannot update decription'].join(' ');
                    console.warn('saveProjectDescription:::');
                    console.warn(msg);
                    callback(new Error(msg));
                    return;
                }
                if (!projectData.keyDescriptions) {
                    projectData.keyDescriptions = {};
                }
                if (description !== '') {
                    projectData.keyDescriptions[keyId] = description;
                } else {
                    delete projectData.keyDescriptions[keyId];
                }

                writeProjectConfigFile({data: projectData, id, name, url, file}, (err) => {
                    if (!err) {
                        callback(null);
                    } else {
                        callback(err);
                    }
                });
            });
        },
        /**
         *
         * Rename a category
         * @param projectId
         * @param oldName
         * @param newName
         * @param cb
         */
        renameCategory: function(projectId, oldName, newName, cb) {
            this.loadProject(projectId, (projectObj, {id, name, url, file}) => {
                if (projectObj.keys) {
                    Object.keys(projectObj.keys).forEach((lang) => {
                        Object.keys(projectObj.keys[lang]).forEach((key) => {
                            var splitted = key.split('_'),
                                oldCategoryName = splitted.shift(),
                                newKeyName = `${newName}_${splitted.join('_')}`;

                            if (oldCategoryName === oldName) {
                                // Rename child key descriptions
                                cloneKeyDescription(projectObj.keyDescriptions, key, newKeyName, true);
                                projectObj.keys[lang][newKeyName] = projectObj.keys[lang][key];
                                delete projectObj.keys[lang][key];
                            }
                        });
                    });

                    // Rename category description
                    cloneKeyDescription(projectObj.keyDescriptions, oldName, newName, true);

                    writeProjectConfigFile({data: projectObj, id, name, url, file}, (err) => {
                        if (!err) {
                            cb(null, oldName, newName);
                        } else {
                            cb(err);
                        }
                    });
                } else {
                    cb(new Error('There are no keys in project ' + projectId));
                }
            });
        },
        /**
         *
         * remove a key
         * @param projectId
         * @param catName
         * @param cb
         */
        removeCategory: function(projectId, catName, cb) {
            this.loadProject(projectId, (projectObj, {id, name, url, file}) => {
                
                console.log('dao:removeCategory', projectId, projectObj)
                
                if (projectObj.keys) {
                    Object.keys(projectObj.keys).forEach((lang) => {
                        Object.keys(projectObj.keys[lang]).forEach((key) => {
                            var categoryName = key.split('_')[0];
                            if (categoryName === catName) {
                                delete projectObj.keys[lang][key];
                                if (projectObj.keyDescriptions.hasOwnProperty(key)) {
                                    delete projectObj.keyDescriptions[key];
                                }
                            }
                        });
                    });

                    if (projectObj.keyDescriptions.hasOwnProperty(catName)) {
                        delete projectObj.keyDescriptions[catName];
                    }

                    writeProjectConfigFile({data: projectObj, id, name, url, file}, (err) => {
                        if (!err) {
                            cb(null, catName);
                        } else {
                            cb(err);
                        }
                    });
                } else {
                    cb(new Error('There are no keys in project ' + projectId));
                }
            });
        },
        /**
         *
         * Delete a project physically.
         * @param parentDirectory
         * @param projectName
         * @param cb
         */
        deleteProject: function(projectId, cb) {
    
            const id = projectId
            let currentProject
            
            projectHandler.read()
                .then(projectJSON => {
    
                    if (!projectJSON.projects[id])
                        throw "Project does not exists " + id
    
                    return new Promise((resolve, reject) => {
                        fs.unlink(path.normalize(projectFolder + projectJSON.projects[id].file), function(err) {
                            if (err)
                                reject(err)
                            else
                                resolve()
                        })
                    })
                    .then(() => {
                        currentProject = projectJSON.projects[id]
                        delete projectJSON.projects[id]
                        return projectJSON
                    })
                    .then(projectHandler.save)
                    .then(() => {
                        currentProject.id = projectId
                        cb(null, currentProject)
                    })
                    
                }).catch(err => {
                    console.log(err)
                    cb(err)
                })
        },
        /**
         * TODO test projectHandler
         *
         * Delete a folder physically.
         * @param id
         * @param dirName @deprectaed - just pass the folder id as 
         * @param cb
         */
        deleteFolder: function(id, cb) {

            var folderPath = projectFolder + id;

            fs.rmdir(folderPath, function(err) {
                if (!err) {
                    cb(null, id);
                } else {
                    cb(err);
                }
            });
        },
        /**
         * TODO test projectHandler
         *
         * @param project id
         * @param language
         * @param keyAndValue
         * @param cb a callback function where 1st parameter is an optional Error (null on success) and 2nd/3rd parameter
         * are key name and value (only given on success).
         */
        saveKey: function(projectId, language, keyAndValue, cb) {
            this.loadProject(projectId, (projectData, {id, name, url, file}) => {
                if (!projectData) {
                    var msg = ['Project', projectId, 'does not exist, key', keyAndValue, 'cannot be saved'].join(' ');
                    console.warn(msg);
                    cb(new Error(msg));
                    return;
                }

                // check if language exists, provide empty object if needed
                if (!projectData.keys[language]) {
                    projectData.keys[language] = {};
                }
                // if the pipe empty string is missing then the key want be created
                projectData.keys[language][keyAndValue.key] = keyAndValue.value || '';

                writeProjectConfigFile({data: projectData, id, name, url, file}, (err) => {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, keyAndValue.key, keyAndValue.value);
                    }
                });
            });
        },
        /**
         * TODO test projectHandler
         *
         * @param projectId
         * @param keyAndValue
         * @param cb
         */
        cloneKey: function(projectId, keyAndValue, cb) {
            this.loadProject(projectId, (projectData, {id, name, url, file}) => {
                if (!projectData) {
                    var msg = ['Project', projectId, 'does not exist, key', keyAndValue, 'cannot be cloned'].join(' ');
                    console.warn(msg);
                    cb(new Error(msg));
                    return;
                }

                var translations = projectData.keys,
                    keys = Object.keys(translations),
                    currentBundle,
                    currentLang,
                    oldKey = keyAndValue.sourceCategory + '_' + keyAndValue.key,
                    newKey = keyAndValue.targetCategory + '_' + keyAndValue.key,
                    result = {
                        key: newKey,
                        values: {}
                    };

                for (var i = 0; i < keys.length; i++) {
                    currentLang = keys[i];
                    currentBundle = translations[currentLang];
                    if (currentBundle.hasOwnProperty(keyAndValue.id)) {
                        currentBundle[newKey] = currentBundle[keyAndValue.id];
                        result.values[currentLang] = currentBundle[keyAndValue.id];
                    }
                }

                cloneKeyDescription(projectData.keyDescriptions, oldKey, newKey);
                result.keyDescriptions = projectData.keyDescriptions;

                writeProjectConfigFile({data: projectData, id, name, url, file}, (err) => {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, projectId, result);
                    }
                });
            });
        },
        /**
         * TODO test projectHandler
         *
         * @param project id
         * @param language
         * @param obj the key value object which will be merged and saved with the existing one
         * @param cb a callback function where 1st parameter is an optional Error (null on success) and 2nd/3rd is true if saved success
         */
        saveBundle: function(projectId, lang, obj, cb) {
            this.loadProject(projectId, (projectData, {id, name, url, file}) => {
                var language = lang;
                if (!projectData) {
                    var msg = ['Project', projectId, 'does not exist, key', obj, 'cannot be saved'].join(' ');
                    console.warn(msg);
                    cb(new Error(msg));
                    return;
                }

                if (language === undefined) {
                    language = projectData.defaultLanguage;
                }

                // if the language is not supported skip it
                console.log('dao:availabllanguages', projectData.availableLanguages);
                if (projectData.availableLanguages.indexOf(language) === -1) {
                    console.log('dao:BAM');
                    cb(null, false);
                    return;
                }

                // check if language exists, provide empty object if needed
                if (!projectData.keys[language]) {
                    projectData.keys[language] = {};
                }
                Object.keys(obj).forEach(function(key) {
                    var newKey = key;
                    if (!/_/.test(key)) {
                        newKey = 'generic_' + key;
                    }
                    projectData.keys[language][newKey] = obj[key];
                });

                writeProjectConfigFile({data: projectData, id, name, url, file}, (err) => {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, true);
                    }
                });
            });
        },
        /**
         * Moves a project
         * @param id
         * @param url
         * @param name
         * @param cb
         */
        moveProject : function ({id, url, name}, cb) {
            projectHandler.read()
                .then(projects => {
                    if (!projects.projects[id])
                        throw {error: ERRORS.PROJECT_NOT_EXISTS, message: id + ' does not exist'}
    
                        // Continue - throw error code to tell the user the problem :) - FE side will be also ok
                    if (url && url[0] !== '/')
                        throw {error: ERRORS.VALIDATION, message: 'invalid url - it must start with a slash!'}
                        
                    return projects
                })
                .then(projects => {
                    if (projects.projects[id].url === url)
                        return projects
                    // folder has changed lets create one
                    return new Promise((resolve, reject) => {
                        fs.stat(projectFolder + url, (err, stats) => {
                            if (!err && stats.isDirectory()) {
                                resolve(projects)
                            } else {
                                mkdir(projectFolder, url, (err, stats) => {
                                    resolve(projects)
                                })
                            }
                        })
                    })
                })
                .then(projects => {
                    projects.projects[id].name = name || projects.projects[id].name
                    projects.projects[id].url = url || projects.projects[id].url
                    return projects
                })
                .then(projectHandler.save)
                .then(projects => cb(null, {
                    id: id,
                    name: projects.projects[id].name,
                    url: projects.projects[id].url
                }))
                .catch(err => {
                    console.error('moveProject failed', err)
                    cb(err)
                })
        },
        /**
         * TODO test projectHandler
         *
         * @param projectId
         * @param data
         * @param cb
         */
        importJSON: function(projectId, data, cb) {
            this.loadProject(projectId, (projectData, {id, name, url, file}) => {
                if (!projectData) {
                    var msg = `Project ${projectId} does not exist, JSON cannot be imported`;
                    console.warn(msg);
                    cb(new Error(msg));
                    return;
                }

                var localKeys = projectData.keys,
                    availableLanguages = projectData.availableLanguages,
                    uploadedLanguages = Object.keys(data),
                    currentLanguage,
                    localLangKeys,
                    uploadedLangKeys,
                    currentKey;

                for (var i = 0; i < uploadedLanguages.length; i++) {
                    currentLanguage = uploadedLanguages[i],
                        localLangKeys = localKeys[currentLanguage] || {};

                    if (availableLanguages.indexOf(currentLanguage) > -1) {
                        uploadedLangKeys = data[currentLanguage];
                        for (var key in uploadedLangKeys) {
                            if (uploadedLangKeys.hasOwnProperty(key)) {
                                currentKey = getTranslationsForKey({key: key, uploadedKeys: uploadedLangKeys});
                                if (currentKey instanceof TypeError) {
                                    cb(currentKey);
                                    return;
                                } else {
                                    Object.keys(currentKey).forEach(function(key) {
                                        localLangKeys[key] = currentKey[key].toString();
                                    });
                                }
                            }
                        }
                        if (!localKeys[currentLanguage]) {
                            localKeys[currentLanguage] = localLangKeys;
                        }
                    }
                }

                writeProjectConfigFile({data: projectData, id, name, url, file}, (err) => {
                    if (!err) {
                        cb(null, projectId, projectData);
                    } else {
                        cb(err);
                    }
                });

            });
        },
        /**
         * TODO test projectHandler
         *
         * rename a key
         *
         * @param projectId
         * @param data {oldKey : String, newKey : String}
         * @param cb
         */
        renameKey: function(projectId, data, cb) {
            var keyFound = 0;
            this.loadProject(projectId, (projectObj, {id, name, url, file}) => {
                if (projectObj.keys) {

                    keyFound += renameKeyForObject(projectObj.keys, data.oldKey, data.newKey);

                    if (keyFound === 0) {
                        // then no key was updated so the key could not be renamed
                        var msg = 'No keys have been renamed';
                        console.warn(msg);
                        cb(new Error(msg));
                    } else {
                        renameKeyForObject(projectObj.keyDescriptions, data.oldKey, data.newKey);
                        writeProjectConfigFile({data: projectObj, id, name, url, file}, (err) => {
                            if (!err) {
                                cb(null, data.oldKey, data.newKey);
                            } else {
                                cb(err);
                            }
                        });
                    }
                }
            });
        },
        /**
         * TODO test projectHandler
         *
         * remove a key
         * @param projectId
         * @param keyName
         * @param cb
         */
        removeKey: function(projectId, keyName, cb) {
            this.loadProject(projectId, (projectObj, {id, name, url, file}) => {
                if (projectObj.keys) {
                    // TODO there is no detection if the key was deleted successful
                    Object.keys(projectObj.keys).forEach((lang) => {
                        if (projectObj.keys[lang].hasOwnProperty(keyName)) {
                            delete projectObj.keys[lang][keyName];
                        }
                    });

                    if (projectObj.keyDescriptions.hasOwnProperty(keyName)) {
                        delete projectObj.keyDescriptions[keyName];
                    }

                    writeProjectConfigFile({data: projectObj, id, name, url, file}, (err) => {
                        if (!err) {
                            cb(null, keyName);
                        } else {
                            cb(err);
                        }
                    });
                } else {
                    cb(new Error('There are no keys in project ' + projectId));
                }
            });
        },
        /**
         * TODO test projectHandler
         *
         * dir should always start with a slash!
         * @param dir
         * @param cb
         */
        getDirectory: function(dir, cb) {
            if (dir[0] === '/') {

                projectHandler.listFiles(dir)
                    .then(projectList => {
                        fileManager.listDir(dir, function(entry) {
                            const directories = [];
                            if (entry) {
                                entry.value.forEach((item) => {
                                    if (item.d) {
                                        directories.push({
                                            name: item.name,
                                            id: computeIdFromPath(item.id)
                                        });
                                    }
                                });
                                // TBD do not include parentDir if there is none (this would make the decision in the client if user
                                //      can go to a parent dir more transparent: instead of checking for "/" just check for null)
                                cb(null, {
                                    projects: projectList,
                                    dirs: directories,
                                    parentDirectory: fileManager.getParentDirectory(dir),
                                    currentDirectory: dir,
                                    parentDirectories: getParentDirs(dir)
                                });
                            } else {
                                cb(null, false)
                            }
                        });
                    })
                    .catch(err => {
                        console.error(err)
                        cb({
                            message: "Problem to fetch directory"
                        })
                    })
            } else {
                console.error('dao:ask for a not valid directory type - all directories must be start with a slash!');
                cb(false);
            }
        },
        /**
         *
         * @param projectId
         * @param key
         * @param fileName
         * @param callback
         */
        addImage: function(projectId, key, fileName, callback) {
            this.loadProject(projectId, (projectData, {id, name, url, file}) => {
                if (!projectData) {
                    var msg = ['Project', projectId, 'does not exist, cannot add the new image'].join(' ');
                    console.warn(msg);
                    callback(new Error(msg));
                    return;
                }
                if (!projectData.images) {
                    projectData.images = {};
                }
                projectData.images[key] = fileName;

                writeProjectConfigFile({data: projectData, id, name, url, file}, (err) => {
                    if (!err) {
                        callback(null);
                    } else {
                        callback(err);
                    }
                });
            });
        },
        /**
         *
         * @param projectId
         * @param categoryName
         * @param callback
         */
        removeImage: function(projectId, categoryName, callback) {
            this.loadProject(projectId, (projectData, {id, name, url, file}) => {

                var fullPath,
                    sendError = (msg) => {
                        console.warn(msg);
                        callback(new Error(msg));
                    };

                if (!projectData) {
                    sendError(`Project ${projectId} does not exist, cannot remove image for category ${categoryName}`)
                    return
                } else if (!projectData.images || !projectData.images[categoryName]) {
                    sendError(`Value for key category ${categoryName} not found in project configuration.`)
                    return
                }
                // images without a slash at front are old image upload - this is only to be backward compatible
                if (projectData.images[categoryName][0] === '/') {
                    fullPath = path.normalize(uploadFolder + '/' + projectData.images[categoryName])
                } else {
                    fullPath = path.normalize(uploadFolder + '/' + projectData.projectId + '/' + projectData.images[categoryName])
                }
                
                if (!fs.existsSync(fullPath)) {
                    sendError(`Could not delete image. File ${'/' + projectData.projectId + '/' + projectData.images[categoryName]} does not exist.`);
                    return
                } else {
                    fs.unlinkSync(fullPath)
                }

                delete projectData.images[categoryName];
                writeProjectConfigFile({data: projectData, id, name, url, file}, (err) => {
                    if (!err) {
                        callback(null);
                    } else {
                        callback(err);
                    }
                });
            });
        },
        setupClient: function(client, cb) {
            cb(Date.now());
        }
    };
};
/**
 * Returns the dao interface - @deprecated please use the Dao constructor to handle asynchronous
 *
 * @type {dao}
 */
module.exports = dao