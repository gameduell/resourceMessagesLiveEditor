(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

/**
 * Error constants
 *
 * @type {{PROJECT_NOT_EXISTS: number, INVALID_URL: number, NO_PERMISSION: number}}
 */
module.exports = {
  PROJECT_NOT_EXISTS: 'PROJECT_NOT_EXISTS',
  VALIDATION: 'VALIDATION',
  NO_PERMISSION: 'NO_PERMISSION'
};

},{}],2:[function(require,module,exports){
'use strict';

var C = {
    FILE_MANAGER: {
        FILE_TYPES: {
            IMAGE: 'image',
            FILE: 'file'
        },
        ENCODING: {
            image: 'base64',
            file: 'utf8'
        }
    },
    SESSION: {
        renewal_interval_in_ms: 1000 * 15
    }
};

module.exports = C;

},{}],3:[function(require,module,exports){
'use strict';

/**
 * TODO fade out when maxLengthOfMessages exceeded looks not so nice
 * @param id
 * @return {Object}
 * @constructor
 */
var toast = new function Toast(id) {
    var DELAY = 4000,
        opacityFadeSteps = 0.04,
        maxLengthOfMessages = 4,
        toastNode = document.getElementById(id),
        isReadyForStartAgain = true,
        newMessage = true,
        initToast = function initToast() {
        var rootNode = document.getElementsByTagName('body')[0];
        toastNode = document.createElement('div');
        toastNode.id = id;
        toastNode.style.cssText = "position:fixed;z-index:999;top:4.5em;right:2em;border-radius:5px;color:#fff;font-size:1.2em;font-weight:bold;background-color:rgba(63,143,251,0.9);padding: 1em 0.5em; box-sizing: border-box; max-width: 50%; text-align: center; word-wrap: break-word; break-word: break-all;";
        rootNode.appendChild(toastNode);
    },
        toast = {
        fadeOut: function fadeOut(_node, _done) {
            var node = _node;
            var done = _done;
            var opacity = 1;
            (function decrementOpacity() {
                if (opacity > opacityFadeSteps) {
                    opacity = opacity - opacityFadeSteps;
                    node.style.opacity = opacity;
                    setTimeout(function () {
                        decrementOpacity();
                    }, 40);
                } else {
                    console.log('PARENT NODE:');
                    console.log(node);
                    console.log(node.parentNode);
                    if (node.parentNode != null) {
                        node.parentNode.removeChild(node);
                    }
                    done();
                }
            })();
        },
        showMessage: function showMessage(msg) {
            if (!toastNode) {
                initToast();
            }
            toastNode.style.opacity = 1;
            var p = document.createElement('p');
            p.style.cssText = "padding:0px 10px";
            p.innerHTML = msg;
            toastNode.insertBefore(p, toastNode.firstChild);
            (function fadeOutToMuchMessages() {
                if (toastNode.childNodes.length > maxLengthOfMessages) {
                    toast.fadeOut(toastNode.children[toastNode.children.length - 1], function () {
                        fadeOutToMuchMessages();
                    });
                }
            })();
            var timeOut = DELAY;
            newMessage = true;
            function fadeOut(_fc) {
                var fc = _fc;
                var opacity = toastNode.style.opacity;
                if (opacity > opacityFadeSteps) {
                    if (newMessage) {
                        // resetMessage
                        newMessage = false;
                        timeOut = DELAY;
                        toastNode.style.opacity = 1;
                    } else {
                        opacity = opacity - opacityFadeSteps;
                        toastNode.style.opacity = opacity;
                        timeOut = 40;
                    }
                    // start timer
                    setTimeout(function () {
                        fadeOut(fc);
                    }, timeOut);
                } else {
                    while (toastNode.firstChild) {
                        toastNode.removeChild(toastNode.firstChild);
                    }
                    toastNode.style.opacity = 0;
                    // callback
                    fc(true);
                }
            }
            if (isReadyForStartAgain) {
                isReadyForStartAgain = false;
                timeOut = DELAY;
                fadeOut(function (_b) {
                    isReadyForStartAgain = true;
                });
            }
        }
    };
    return toast;
}('toast');

if (typeof module != "undefined") {
    console.log('exports');
    module.exports = toast;
} else {
    console.log('asign to global scope');
    window.toast = toast;
}

},{}],4:[function(require,module,exports){
'use strict';

/**
 * controller for the image uplaoder view - calls the server to upload a image and notifier the ui event handler
 * @type {{}}
 */
var canny = require('canny'),
    JMBFUploader = canny.JMBFUploader,
    displayManager = canny.displayManager,
    uiEvents = require('../uiEventManager.js'),
    uploadId,
    projectInfo;
/**
 * Call this for each file - will call a call back with the server answer
 * @param file
 */
function sendFile(file, directCallback) {
    var uri = '/uploadJMBFFile?projectId=' + projectInfo.id + '&project=' + projectInfo.name,
        xhr = new XMLHttpRequest(),
        fd = new FormData();

    xhr.open("POST", uri, true);
    xhr.onreadystatechange = function () {
        var data;
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Handle response.
            data = JSON.parse(xhr.responseText);
            directCallback && directCallback(data); // handle response.
            // {file: "//sub/sub1/sub1_blue_coke.jpg", name: "sub1_blue_coke.jpg", type: "image/jpg"}
            console.log(data);
            uiEvents.callUievent('JMBFFileUploaded', projectInfo.id, uploadId, data.name);
        } else if (xhr.readyState == 4 && xhr.status === 406) {
            toast.showMessage('Upload failure. The file language is not supported');
        }
    };
    fd.append('myFile', file);
    // Initiate a multipart/form-data upload
    xhr.send(fd);
}

/**
 * Save data in member variable used by further upload operations
 * @param data: Project data
 */
function applyProjectData(data, project) {
    projectInfo = project;
}

uiEvents.addUiEventListener({
    showJMBFUploader: function showJMBFUploader(id) {
        displayManager.show('JMBFUploaderView');
    }
});

JMBFUploader.onUpload(function (file) {
    // TODO additional to the upload id we need the project ID
    console.log('uploadController:upload id: file:', uploadId, file);
    sendFile(file);
});

module.exports = {
    onNewProjectCreated: applyProjectData,
    onLoadProject: applyProjectData
};

},{"../uiEventManager.js":23,"canny":52}],5:[function(require,module,exports){
'use strict';

var canny = require('canny'),
    JsonImport = canny.JsonImport,
    displayManager = canny.displayManager,
    uiEvents = require('../uiEventManager.js'),
    uploadId,
    projectInfo;

function sendFile(file) {
    var uri = '/importJSON?projectId=' + projectInfo.id + '&project=' + projectInfo.name,
        xhr = new XMLHttpRequest(),
        fd = new FormData();

    xhr.open("POST", uri, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            var data = JSON.parse(xhr.responseText);
            if (xhr.status == 200) {
                // data.name does not exist - and is also not used, is it ?
                uiEvents.callUievent('jsonImported', projectInfo.id, uploadId, data.name);
            } else if (xhr.status === 406) {
                toast.showMessage('Upload failure. There is an error:<br />' + data.msg);
            }
        }
    };
    fd.append('myFile', file);
    xhr.send(fd);
}

function applyProjectData(data, project) {
    projectInfo = project;
}

uiEvents.addUiEventListener({
    showJSONImport: function showJSONImport(id) {
        displayManager.show('JSONImportView');
    }
});

JsonImport.onUpload(function (file) {
    sendFile(file);
});

module.exports = {
    onNewProjectCreated: applyProjectData,
    onLoadProject: applyProjectData
};

},{"../uiEventManager.js":23,"canny":52}],6:[function(require,module,exports){
'use strict';

var async = require('canny/mod/async'),
    auth = require('canny').auth;

auth.onLogout(function () {
    async.doAjax({
        path: '/logout',
        onSuccess: function onSuccess(response) {
            location.reload();
        }
    });
});

module.exports = {};

},{"canny":52,"canny/mod/async":53}],7:[function(require,module,exports){
'use strict';

var breadcrumb = require('../uiModules/breadcrumb'),
    canny = require('canny'),
    trade = require('../trade'),
    uiEvents = require('../uiEventManager');

canny.add('breadcrumb', breadcrumb);

breadcrumb.onClick(function (directoryId) {
    trade.getDirectory(directoryId, function (err) {
        if (err !== false) {
            // TODO call the
            uiEvents.callUievent('showOverviewPage');
        } else {
            console.log('breadcrumbController:getDirectory can not load project for directory name:', directoryId);
        }
    });
});

module.exports = {
    setPath: function setPath(url) {
        var path = '/';
        if (url === '/') return breadcrumb.updateFolders([{ id: '/', name: '' }]);

        breadcrumb.updateFolders(url.split('/').map(function (folder) {
            path = path[path.length - 1] !== '/' ? path + '/' + folder : path + folder;
            return {
                id: path, name: folder
            };
        }));
    },
    getDirectory: function getDirectory(data) {
        console.log('breadcrumbController:parentDirectories', data.parentDirectories);
        breadcrumb.updateFolders(data.parentDirectories);
    }
};

},{"../trade":22,"../uiEventManager":23,"../uiModules/breadcrumb":28,"canny":52}],8:[function(require,module,exports){
'use strict';

var createNewProject = require('canny').createNewProject,
    displayManager = require('canny').displayManager,
    trade = require('../trade');

var currentDirectory;

createNewProject.onCreateNewProject(function (projectName) {
    trade.createNewProject(projectName, currentDirectory);
    displayManager.hide('createNewProjectView');
});

createNewProject.onCreateNewDirectoy(function (directoryName) {
    trade.createNewDirectory(directoryName, currentDirectory);
    displayManager.hide('createNewDirectoryView');
});

module.exports = {
    // TODO introduce new event: onDirectoryChanged - because a "getDirectory" event does not really explain what's
    // happening here
    getDirectory: function getDirectory(data) {
        currentDirectory = data.currentDirectory;
    }
};

},{"../trade":22,"canny":52}],9:[function(require,module,exports){
'use strict';

var anchorMenu = require('canny').anchorMenu,
    translationViewConfig = require('../uiModules/translationView').config,
    uiEvents = require('../uiEventManager');

/**
 * Nice approach but the order is different from the DOM.
 * TODO It would be better to read the elements from the DOM
 *  1. it's easier to reinitialize if a key is renamed or created new (Y)
 *  2. the order will be same as in the DOM (Y)
 *  con: we need to wait until the DOM is rendered - otherwise elements will be missing
 *
 *  We need:
 *  * DOM render success event (the translationView controller has to throw it) (so far the controller is added after the translationController it looks like that this is not an issue)
 *  * an a if anchor is clicked (in view) event ; then also focus the correct menu right element
 *  * the right menu element interact only as scroll overview - not as anchor helper as it is right now
 *
 * @param keys
 */

anchorMenu.onSelect(function (id) {
    var dom = document.getElementById(translationViewConfig.rowPrefix + id);
    if (dom) {
        var bodyRect = document.body.getBoundingClientRect(),
            elemRect = dom.getBoundingClientRect(),
            offset = elemRect.top - bodyRect.top;
        window.scrollTo(0, offset - 60);
        uiEvents.callUievent('anchorFocus', '#' + id);
    }
});

uiEvents.addUiEventListener({
    anchorFocus: function anchorFocus(id) {
        anchorMenu.focusElement(id.replace('#', ''));
    }
});

module.exports = {
    renameCategory: function renameCategory(oldName, newName) {
        anchorMenu.renderMenu();
    },
    removeCategory: function removeCategory(categoryName) {
        anchorMenu.renderMenu();
    },
    renameKey: function renameKey(oldKey, newKey) {
        anchorMenu.renderMenu();
    },
    removeKey: function removeKey(key) {
        anchorMenu.renderMenu();
    },
    onCreateKey: function onCreateKey() {
        anchorMenu.renderMenu();
    },
    onKeyCloned: function onKeyCloned(projectId, data) {
        anchorMenu.renderMenu();
    },
    /**
     * Will be called with the complete JSON object from a specific project
     * @param projectData
     */
    onLoadProject: function onLoadProject(projectData) {
        anchorMenu.renderMenu();
    },
    onNewProjectCreated: function onNewProjectCreated() {
        anchorMenu.renderMenu();
    }
};

},{"../uiEventManager":23,"../uiModules/translationView":41,"canny":52}],10:[function(require,module,exports){
'use strict';

var whisker = require('canny/mod/whisker');
var canny = require('canny');
var displayManager = canny.displayManager;
var trade = require('../trade');
var ERRORS = require('../../../ERRORS');

var inputNodes = {
    name: undefined,
    url: undefined
    // whisker callback for rendering the ui module
};var renderUi = void 0;
// save the actual loaded project config - needed for comparision
var project = void 0;

function noReturn(node) {
    node.addEventListener('keypress', function (e) {
        var key = e.keyCode || e.which;
        if (key === 13) e.returnValue = false;
        return true;
    });
    return node;
}

function noSpaces(node) {
    node.addEventListener('keypress', function (e) {
        var key = e.keyCode || e.which;
        if (key === 32) e.returnValue = false;
        return true;
    });
    return node;
}

function trimSlashes(url) {

    while (/\/\//.test(url)) {
        url = url.replace('//', '/');
    } // remove last slash if there is one
    if (url.length > 1 && url[url.length - 1] === '/') url = url.slice(0, -1);

    return url;
}

function removeSpaces(s) {
    while (/ /.test(s)) {
        s = s.replace(' ', '_');
    }return s;
}

function _submit() {
    trade.moveProject({
        id: project.id,
        url: removeSpaces(trimSlashes(inputNodes.url.value || ui.url)),
        name: inputNodes.name.value || ui.name
    }, function (err, _ref) {
        var id = _ref.id,
            name = _ref.name,
            url = _ref.url;

        if (err) {
            displayManager.hide('moveProject');
            if (ERRORS[err.error]) {
                toast.showMessage('Changing ' + inputNodes.name.value + ' failed: ' + err.message);
                toast.showMessage(err.error);
            } else {
                toast.showMessage('Failure ' + inputNodes.name.value + ' failed: ' + err.message);
                toast.showMessage('ERROR UNKNOWN');
            }
        } else {
            displayManager.hide('moveProject');
            // show/reload actual directory
            trade.getDirectory(url);
            if (project.url !== url) toast.showMessage('Change project location successfully to ' + url);
            if (project.name !== name) toast.showMessage('Rename project successfully to ' + name);
        }
    });
}

var ui = {
    inputName: function inputName(n) {
        return inputNodes.name = noReturn(n);
    },
    inputUrl: function inputUrl(n) {
        return inputNodes.url = noReturn(noSpaces(n));
    },
    submit: function submit(n) {
        return n.addEventListener('click', function () {
            return _submit();
        });
    },
    cancel: function cancel(n) {
        return n.addEventListener('click', function () {
            return displayManager.hide('moveProject');
        });
    },
    name: '',
    url: '',
    id: '',
    projectLink: ''
};

canny.add('moveProject', {
    add: function add(node) {
        whisker.add(node, function (fc) {
            renderUi = fc;
            renderUi(ui);
        });
    }
});

module.exports = {
    show: function show(_ref2) {
        var id = _ref2.id,
            url = _ref2.url,
            name = _ref2.name;


        project = { id: id, url: url, name: name };

        renderUi({
            id: id,
            url: url,
            name: name,
            projectLink: '/' + id + '.prj'
        });
        displayManager.show('moveProject');
    }
};

},{"../../../ERRORS":1,"../trade":22,"canny":52,"canny/mod/whisker":56}],11:[function(require,module,exports){
'use strict';

var canny = require('canny');

/**
 * just the implementation of the callbacks
 */

/**
 * Apply project description data to dom elements
 * @param data: Project configuration data
 */
function applyProjectData(data, project) {
    if (project.hasOwnProperty('name')) {
        // project specific config
        canny.texts.setTexts({ projectName: project.name });
    }

    // FIXME: Categories should not be named "__description" as they would override the project description
    if (data.hasOwnProperty('keyDescriptions')) {
        // project specific config - if property is present
        canny.texts.setTexts({
            projectDescription: data.keyDescriptions['__description'] ? data.keyDescriptions['__description'] : ''
        });
    }
}

module.exports = {
    onNewProjectCreated: applyProjectData,
    onLoadProject: applyProjectData,
    onNewDirectoryCreated: function onNewDirectoryCreated(data) {
        canny.texts.setTexts({
            projectName: data.directoryId
        });
    }
};

},{"canny":52}],12:[function(require,module,exports){
'use strict';

var canny = require('canny'),
    domOpts = require('dom-opts'),
    trade = require('../trade.js'),
    events = require('../events.js'),
    uiEvents = require('../uiEventManager.js'),
    keyValueCounter = {
    projectMap: {},
    getCountObj: function getCountObj() {
        return {
            keyMap: {}, // just collect all unique keys for getting total number of existing keys
            langMap: {} // save for each language all "valid" keys
        };
    }
},
    projectConfig = {},
    projectInfo = {},
    availableLanguages = [];

canny.projectMainNavigation.onLanguageSelect(function (obj) {
    var eventName;
    if (obj.isActive) {
        eventName = obj.isInactive ? 'deActivateLanguage' : 'activateLanguage';
        uiEvents.callUievent(eventName, obj.language);
    } else {
        uiEvents.callUievent('addLanguage', obj.language);
    }
});

(function () {
    var editorModeEnabled = false;

    canny.projectMainNavigation.onEnableEditorMode(function () {
        console.log('projectMainNavigationController:onEnableEditorMode show JSON format in new tab.');
        uiEvents.callUievent('enableEditorMode', !editorModeEnabled);
    });
    //maybe someone else calls this too
    uiEvents.addUiEventListener({
        enableEditorMode: function enableEditorMode(enabled) {
            editorModeEnabled = enabled;
        }
    });
})();

(function () {
    var wordCountEnabled = false;

    canny.projectMainNavigation.onToggleWordCount(function () {
        wordCountEnabled = !wordCountEnabled;
        uiEvents.callUievent('toggleWordCount', wordCountEnabled);
    });
})();

canny.projectMainNavigation.onShowJSON(function () {
    console.log('projectMainNavigationController:onShowJSON show JSON format in new tab.');
    window.open('/' + projectInfo.id + '.json?category=true', '_blank' // <- This is what makes it open in a new window.
    );
});

canny.projectMainNavigation.onShowJMBFUploader(function () {
    console.log('projectMainNavigationController:onShowJMBFUploader show message bundle uploader');
    uiEvents.callUievent('showJMBFUploader');
});

canny.projectMainNavigation.onShowJSONImport(function () {
    console.log('projectMainNavigationController:onShowJSONImport show JSON import overlay');
    uiEvents.callUievent('showJSONImport');
});

canny.projectMainNavigation.onShowJMBF(function () {
    console.log('projectMainNavigationController:onShowJMBF show JMBF format in new tab.');

    var lang = window.prompt('Enter a language code. E.g.: ' + function () {
        var existingLanguages = [];
        Object.keys(projectConfig.keys).forEach(function (lang) {
            if (Object.keys(projectConfig.keys[lang]).length > 0) {
                existingLanguages.push(lang);
            }
        });
        return existingLanguages;
    }().join(', '));

    if (lang !== null) {
        window.open('/' + projectInfo.id + '.properties' + (lang !== '' ? '?lang=' + lang : ''), '_blank' // <- This is what makes it open in a new window.
        );
    }
});

/**
 * server event listener
 */
events.addServerListener('newProjectWasCreated', function (projectName) {
    toast.showMessage('A new project with name: "' + projectName + '" was created.');
});
/**
 * server event listener
 */
events.addServerListener('keyUpdated', function (projectId, language, keyName, keyValue) {
    // TODO more client changes are coming, we'll finish the code below then
    //if (projectId === currentProjectId) {
    //    var projectName = projectId.substring(projectId.lastIndexOf('/') + 1);
    //    updateKeyToProjectMap(projectName, language, keyName, keyValue);
    //    console.log('projectMainNavigationController:updateKey', projectId, language, keyName, keyValue);
    //}
});
/**
 * server event listener
 */
events.addServerListener('keyDeleted', function (bundleName, obj) {
    // TODO more client changes are coming, we'll finish the code below then
    //if (bundleName === projectConfig.project) {
    //    console.log('projectMainNavigationController:keyRenamed', bundleName, obj);
    //    // TODO update the statistics...
    //}
});

/**
 *
 * @param projectName
 * @param lang
 * @param key
 * @param value
 */
function saveKeyToProjectMap(projectName, lang, key, value) {

    // just collect all keys (only the unique keys are relevant)
    if (keyValueCounter.projectMap[projectName] === undefined) {
        console.log('projectMainNavigationController:saveKeyToProjectMap project name not exists:', projectName);
        keyValueCounter.projectMap[projectName] = keyValueCounter.getCountObj();
    }

    keyValueCounter.projectMap[projectName].keyMap[key] = true;
    if (keyValueCounter.projectMap[projectName].langMap[lang] === undefined) {
        keyValueCounter.projectMap[projectName].langMap[lang] = {};
    }
    // only save the keys as object if it is a valid key otherwise delete it
    if (value) {
        keyValueCounter.projectMap[projectName].langMap[lang][key] = true;
    } else if (keyValueCounter.projectMap[projectName].langMap[lang][key]) {
        // if this key exists than remove it
        delete keyValueCounter.projectMap[projectName].langMap[lang][key];
    }
}

// TODO should use projectId, not projectName
function updateKeyToProjectMap(projectName, lang, key, value) {
    saveKeyToProjectMap(projectName, lang, key, value);
    canny.projectMainNavigation.setNumberOfTranslatedLanguageKey(Object.keys(keyValueCounter.projectMap[projectName].langMap[lang]).length, lang);
    canny.projectMainNavigation.setNumberOfTranslationMaxKeys(Object.keys(keyValueCounter.projectMap[projectName].keyMap).length);
}

// register listener function to the ui events
uiEvents.addUiEventListener({
    /**
     * the internal updateKey event - the server will not trigger the updateKey for the own client
     */
    updateKey: function updateKey(projectName, lang, key, value) {
        console.log('projectMainNavigationController:updateKey', projectName, lang, key, value);
        updateKeyToProjectMap(projectName, lang, key, value);
    },
    projectSelected: function projectSelected(projectId) {
        console.log('projectMainNavigationController:projectSelected Click on project', projectId);
        trade.loadProject(projectId, function (error) {
            if (error === false) console.error('projectMainNavigationController:loadProject fails for projectId:', projectId);
        });
    },
    activateLanguage: function activateLanguage(lang) {
        canny.projectMainNavigation.activateLang(lang);
    },
    deActivateLanguage: function deActivateLanguage(lang) {
        canny.projectMainNavigation.deActivateLang(lang);
    },
    addLanguage: function addLanguage(lang) {
        canny.projectMainNavigation.activateLang(lang);
    }
});

function computeTotalTranslationProgree(translations) {
    var totalProgress = {};
    Object.keys(translations).forEach(function (lang) {
        Object.keys(translations[lang]).forEach(function (key) {
            totalProgress[key] = undefined;
        });
    });
    return Object.keys(totalProgress).length;
}

function computeTranslationProgress(translations) {
    var progressByLanguage = {};
    Object.keys(translations).forEach(function (lang) {
        progressByLanguage[lang] = Object.keys(translations[lang]).length;
    });
    return progressByLanguage;
}

/**
 * Callback implementation of the onLoadProject & onNewProjectCreated
 * @param projectData (see project JSON file)
 */
function applyProjectData(data, project) {
    projectConfig = data;
    projectInfo = project;

    canny.projectMainNavigation.setAvailableLanguages(data.availableLanguages);

    canny.projectMainNavigation.setActivatedProjectLanguages(computeTotalTranslationProgree(data.keys), computeTranslationProgress(data.keys));

    Object.keys(data.keys).forEach(function (lang) {
        if (Object.keys(data.keys[lang]).length > 0 && availableLanguages.indexOf(lang) !== -1) {

            Object.keys(data.keys[lang]).forEach(function (key) {
                saveKeyToProjectMap(data.project, lang, key, data.keys[lang][key]);
            });

            if (keyValueCounter.projectMap[data.project].langMap[lang]) {
                console.log('projectMainNavigationController:onLoadProject ', keyValueCounter.projectMap[data.project].langMap[lang]);
                console.log('projectMainNavigationController:onLoadProject maxKeys are', Object.keys(keyValueCounter.projectMap[data.project].keyMap).length);
                //canny.projectMainNavigation.setNumberOfTranslationMaxKeys(Object.keys(keyValueCounter.projectMap[projectData.project].keyMap).length);
                //canny.projectMainNavigation.setNumberOfTranslatedLanguageKey(Object.keys(keyValueCounter.projectMap[projectData.project].langMap[lang]).length, lang);
                // TODO refactor this and make one call ;)
                canny.projectMainNavigation.activateLang(lang);
                canny.projectMainNavigation.deActivateLang(lang);
            } else {
                console.log('projectMainNavigationController:onLoadProject get language without any keys for locale:', lang);
            }
        }
    });

    // reset or reinitialize or initialize the key value counter (otherwise the counter can't detect deleted keys. E.g. from the editor mode)
    keyValueCounter.projectMap[data.project] = keyValueCounter.getCountObj();
    // show default language as selected language in menu
    // TODO check who decides to show which language as default - and then call this event from there
    uiEvents.callUievent('activateLanguage', data.defaultLanguage);
}

/**
 * the implementation of the callbacks
 */
module.exports = {
    onNewProjectCreated: applyProjectData,
    onLoadProject: applyProjectData
};

},{"../events.js":18,"../trade.js":22,"../uiEventManager.js":23,"canny":52,"dom-opts":65}],13:[function(require,module,exports){
'use strict';

var projectOverview = require('canny').projectOverview,
    displayManager = require('canny').displayManager,
    trade = require('../trade.js'),
    uiEvents = require('../uiEventManager.js'),
    toast = require('../Toast.js'),
    events = require('../events.js');

var moveProject = require('./moveProjectComponent');

var projectOverviewController = function () {

    var currentParentDirectory, currentDirectory,
    /**
     * Maps project names to projects IDs
     */
    projects,
    /**
     * Maps directory names to directory IDs
     */
    directories;

    uiEvents.addUiEventListener({
        showOverviewPage: function showOverviewPage() {
            displayManager.show('projectsOverview');
        }
    });

    projectOverview.onParentDirectorySelected(function () {
        if (currentParentDirectory !== currentDirectory) {
            trade.getDirectory(currentParentDirectory);
        } else {
            console.log('No parent directory');
        }
    });

    projectOverview.onProjectSelected(function (projectName) {
        uiEvents.callUievent('projectSelected', projects[projectName].id);
    });

    projectOverview.onDirectorySelected(function (directoryName) {
        var directoryId = directories[directoryName];
        trade.getDirectory(directoryId, function () {
            console.log('projectOverviewController:can not load project for directory name:', directoryId);
        });
    });

    projectOverview.onCreateProjectPressed(function () {
        displayManager.show('createNewProjectView');
    });

    projectOverview.onCreateDirectoryPressed(function () {
        displayManager.show('createNewDirectoryView');
    });

    projectOverview.onDeleteFolderPressed(function (dirName) {
        var directoryname = currentDirectory;
        if (directoryname[directoryname.length - 1] !== '/') {
            directoryname += '/';
        }
        trade.deleteFolder(directoryname + dirName, function (err, dirName) {
            var toastMessage;
            if (!err) {
                projectOverview.deleteProjectListNode(dirName.split('/').slice(-1)[0]);
                toastMessage = 'Folder "' + dirName + '" has been deleted.';
            } else {
                toastMessage = 'There was an error: "' + err.message + '"';
            }
            toast.showMessage(toastMessage);
        });
    });

    projectOverview.onMoveDirectoryPressed(function (projectName) {
        return moveProject.show(projects[projectName]);
    });

    projectOverview.onDeleteProjectPressed(function (projectName) {
        trade.deleteProject(projects[projectName].id, function (err, project) {
            var toastMessage;
            if (!err) {
                projectOverview.deleteProjectListNode(project.name);
                toastMessage = 'Project "' + project.name + '" has been deleted.';
            } else {
                toastMessage = 'There was an error: "' + err.message + '"';
            }
            toast.showMessage(toastMessage);
        });
    });

    events.addServerListener('newDirectoryCreated', function (directoryId) {
        var lastDirSepIdx = directoryId.lastIndexOf('/');
        var parentDirectory = directoryId.substring(0, lastDirSepIdx + 1);
        if (parentDirectory === currentParentDirectory) {
            var directoryName = directoryId.substring(lastDirSepIdx + 1);
            directories[directoryName] = directoryId;
            // TODO show message only if projectOverview is currently visible - but canny.flowcontrol currently does not
            // have anything to find out which view is the active one
            toast.showMessage('A new directory "' + directoryName + '" has been created by another user.');
            projectOverview.setProjectsAndDirectories(Object.keys(projects), Object.keys(directories));
        }
    });

    return {
        /**
         * Callback from the server which handles a fresh directory/projects list
         *
         * @param {{currentDirectory:string, dirs:[{name, id}], parentDirectories:[{name, id}], parentDirectory:string, projects:[{name, id}] }} data - an object with 2 properties "projects" and "directories", each listing project/directory names.
         */
        getDirectory: function getDirectory(data) {
            console.log('ProjectOverviewController.getDirectory: ', data);
            if (data === false) {
                console.error("Server call failed");
            } else if (data.hasOwnProperty('projects') && data.hasOwnProperty('dirs')) {

                projects = {};
                data.projects.forEach(function (entry) {
                    projects[entry.name] = entry;
                });

                directories = {};
                data.dirs.forEach(function (entry) {
                    directories[entry.name] = entry.id;
                });

                projectOverview.setProjectsAndDirectories(Object.keys(projects), Object.keys(directories));
                currentParentDirectory = data.parentDirectory;
                currentDirectory = data.currentDirectory;
            } else {
                console.warn('Data rcvd from server is missing expected properties ("projects", "dirs")');
            }
        },
        onNewDirectoryCreated: function onNewDirectoryCreated(data) {
            displayManager.show('projectsOverview');
            trade.getDirectory(data.directoryId, function () {
                console.log('projectOverviewController.onNewDirectoryCreated: trade callback');
            });
        }
    };
}();

module.exports = projectOverviewController;

},{"../Toast.js":3,"../events.js":18,"../trade.js":22,"../uiEventManager.js":23,"./moveProjectComponent":10,"canny":52}],14:[function(require,module,exports){
'use strict';

var textEditor = require('canny').textEditor,
    trade = require('../trade.js'),
    toast = require('../Toast.js'),
    events = require('../events.js'),
    currentProjectId;
/**
 * returns the language or false
 * @param fileName
 * @returns {*}
 */
function getLanguageFromFileName(fileName) {
    var reg = /messages_(.*)\..*./g.exec(fileName);
    if (reg && reg.length === 2) {
        return reg[1];
    }
    return false;
}

/**
 * handle the change project description event in the view
 */
textEditor.onChange(function (id, value, fc) {
    console.log('textEditorController:onChange', value);
    if (currentProjectId) {
        if (!id) {
            // TODO to keep backward functionality this is the "main" project description - will be changed in future
            id = '__description';
        }
        // TODO remove the tv_ from the id
        trade.saveProjectDescription(currentProjectId, id, value, function (success) {
            if (success) {
                fc(true);
                toast.showMessage('Project description changed for project ' + currentProjectId);
            } else {
                fc(false);
            }
        });
    }
});
/**
 * just the implementation of the callbacks
 *
 */
module.exports = {
    onLoadProject: function onLoadProject(data, _ref) {
        var id = _ref.id,
            name = _ref.name,
            url = _ref.url;

        if (id) currentProjectId = id;
    }
};

},{"../Toast.js":3,"../events.js":18,"../trade.js":22,"canny":52}],15:[function(require,module,exports){
'use strict';

var canny = require("canny"),
    translationView = require('../uiModules/translationView'),
    translationViewImageUpload = require('../uiModules/translationViewImageUpload'),
    wordCounter = require('../util/wordCounter'),
    domOpts = require('dom-opts'),
    uiEvents = require('../uiEventManager.js'),
    events = require('../events.js'),
    trade = require('../trade.js'),
    url = require('../util/url'),
    sortByKey = function sortByKey(a, b) {
    if (a.key < b.key) {
        return -1;
    }
    if (a.key > b.key) {
        return 1;
    }
    return 0;
},
    projectConfig,
    projectInfo,
    availableLanguages = [],

/**
 * An object (used as a set datastructure here) holding all existing keys of the project (no matter for how many
 * languages it is used). It is needed when adding a new language, see the function for addLanguage which is added
 * to uiEvents.
 * @type {{}}
 */
existingKeys = {},
    orderedLanguages = [],
    sortLanguages = function sortLanguages(a, b) {
    return orderedLanguages.indexOf(a) - orderedLanguages.indexOf(b);
};

translationViewImageUpload.onUploadButton(function (id) {
    uiEvents.callUievent('showFileUpload', id);
});

translationViewImageUpload.onDeleteButton(function (id) {
    if (confirm('Delete the image for category » ' + id + ' « forever?')) {
        trade.removeImage(projectInfo.id, id);
    }
});

translationView.onCategoryClicked(function (id) {
    uiEvents.callUievent('anchorFocus', '#' + id);
});
/**
 * Setup the UI events and manage the logic for them.
 *
 * TODO replace bundle with locale and refactor the calls from translationView
 */
translationView.onSaveKey(function (key, lang, value) {

    // TODO: Count words and tell word count label to update

    console.log('translationViewController:onSaveValue', [].slice.call(arguments));
    trade.saveKey(projectInfo.id, lang || projectConfig.defaultLanguage, {
        key: key,
        value: value || undefined
    }, function (projectId, language, key, value) {
        var catId;

        if (projectId === projectInfo.id) {
            // prevent applying the callback if project has been changed in the meantime
            catId = key.split('_')[0];
            existingKeys[key] = undefined; // save the key
            projectConfig.keys[lang][key] = value;
            translationView.printBundleTemplate([{
                key: key,
                value: value || ''
            }], language, availableLanguages, function () {
                updateCategoryWordCount(catId, language);
            });

            toast.showMessage('Auto save: "' + key + '" (success)');

            translationView.sendSuccess(key, 'value_');
            // TODO not sure if this is needed
            uiEvents.callUievent('updateKey', projectId, language, key, value);
        }
    });
});

/**
 * Setup the UI events and manage the logic for them.
 *
 * TODO replace bundle with locale and refactor the calls from translationView
 */
translationView.onCreateKey(function (key, lang, value) {
    console.log('translationViewController:onSaveValue', [].slice.call(arguments));
    trade.createKey(projectInfo.id, lang || projectConfig.defaultLanguage, {
        key: key,
        value: value || undefined
    }, function (projectId, language, key, value) {
        var catId = key.split('_')[0];
        if (projectId === projectInfo.id) {
            // prevent applying the callback if project has been changed in the meantime
            existingKeys[key] = undefined; // save the key
            projectConfig.keys[language] = projectConfig.keys[language] ? projectConfig.keys[language] : {};
            projectConfig.keys[language][key] = value;
            translationView.printBundleTemplate([{
                key: key,
                value: value || '',
                words: 0
            }], language, availableLanguages, function () {
                updateCategoryWordCount(catId, language);
            });
            toast.showMessage('Auto save: "' + key + '" (success)');

            translationView.sendSuccess(key, 'value_');
            // TODO not sure if this is needed
            uiEvents.callUievent('updateKey', projectId, language, key, value);
        }
    });
});

translationView.onCloneKey(function (keyId, keyName, fromCategory, toCategory) {
    trade.cloneKey(projectInfo.id, {
        id: keyId,
        key: keyName,
        sourceCategory: fromCategory,
        targetCategory: toCategory
    }, function (err, projectId, data) {
        var texts;
        if (projectId === projectInfo.id) {
            existingKeys[data.key] = undefined;
            texts = data.values;
            for (var lang in texts) {
                if (texts.hasOwnProperty(lang)) {
                    projectConfig.keys[lang][data.key] = texts[lang];
                    translationView.printBundleTemplate([{
                        key: data.key,
                        value: texts[lang] || ''
                    }], lang, availableLanguages, function () {
                        updateCategoryWordCount(toCategory, lang);
                    });
                }
            }
            canny.translationViewDescription.addDescriptions(data.keyDescriptions);
        }
    });
});

/**
 * Read the from param as default language otherwise take it from the project.json
 * @param config
 */
function saveProjectConfig(config, project) {
    var idx,

    // the from parameter can overwrite the default language (legacy)
    defaultLanguage = domOpts.params.from ? domOpts.params.from : config.defaultLanguage;
    projectConfig = config;
    projectInfo = project;

    // Set ${ defaultLanguage } as default in case a project was just created (i.e. does not contain any keys yet)
    // TODO: Better create / add check of object to functional helper object instead ?
    availableLanguages = Object.keys(projectConfig.keys).length === 0 && JSON.stringify(projectConfig.keys) === JSON.stringify({}) ? [defaultLanguage] : Object.keys(projectConfig.keys);

    availableLanguages = availableLanguages.sort(sortLanguages);

    idx = availableLanguages.indexOf(defaultLanguage);

    if (idx !== -1 && idx !== 0) {
        // move default to the begin of the list (this defines the order how the translation languages are shown)
        availableLanguages.splice(0, 0, availableLanguages.splice(idx, 1)[0]);
    }
}

///**
// * TODO replace bundle with locale and refactor the calls from translationView
// * TODO this code is not called!?
// */
//translationView.onAddNewKey(function (lang, key, value, cb) {
//    console.log('translationViewController:onAddNewKey', [].slice.call(arguments));
//    alert('huhu');
//    trade.sendResource({
//        bundle: projectConfig.project,
//        locale: lang
//    }, {
//        key: key,
//        value: value
//    }, function (key) {
//        cb(key)
//    });
//});

translationView.onCreateNewProject(function (prjName, obj) {
    trade.createNewProject(prjName, obj);
});

translationView.onRemoveCategory(function (obj) {
    console.log('translationViewController:onRemoveCategory', obj, projectInfo.id);
    trade.removeCategory(projectInfo.id, obj.category);
});

translationView.onRenameCategory(function (obj) {
    console.log('translationViewController:onRenameCategory', obj, projectInfo.id);
    trade.renameCategory(projectInfo.id, obj.oldName, obj.newName);
});

translationView.onRenameKey(function (obj) {
    console.log('translationViewController:onRenameKey', obj, projectInfo.id);
    trade.renameKey(projectInfo.id, {
        newKey: obj.newKey,
        oldKey: obj.oldKey
    });
});

translationView.onRemoveKey(function (obj) {
    console.log('translationViewController:onRemoveKey', obj, projectInfo.id);
    trade.removeKey(projectInfo.id, obj.key, function (key) {
        var catName = key.split('_')[0];
        for (var lang in projectConfig.keys) {
            if (projectConfig.keys.hasOwnProperty(lang)) {
                delete projectConfig.keys[lang][key];
                updateCategoryWordCount(catName, lang);
            }
        }
    });
});

// register listener function to the ui events
uiEvents.addUiEventListener({
    activateLanguage: function activateLanguage(lang) {
        //        translationViewHeader.showLang(lang);
        translationView.showLang(lang);
    },
    deActivateLanguage: function deActivateLanguage(lang) {
        //        translationViewHeader.hideLang(lang);
        translationView.hideLang(lang);
    },
    toggleWordCount: function toggleWordCount(active) {
        translationView.toggleWordCount(active);
    },
    // TODO  don't trigger it twice for the same language
    addLanguage: function addLanguage(lang) {
        availableLanguages.push(lang);
        availableLanguages = availableLanguages.sort(sortLanguages);
        projectConfig.keys[lang] = {};
        translationView.addLanguage(Object.keys(existingKeys), lang, availableLanguages.indexOf(lang));
        //        translationViewHeader.showLang(lang);
        translationView.showLang(lang);
    },
    enableEditorMode: function enableEditorMode(enabled) {
        translationView.enableEditorMode(enabled);
    },
    fileUploaded: function fileUploaded(projectId, key, url) {
        canny.translationViewImageUpload.appendImage(key, url);
    },
    JMBFFileUploaded: function JMBFFileUploaded(projectId) {
        trade.loadProject(projectId, function (error) {
            if (error === false) console.error('translationViewController:loadProject fails for projectId:', projectInfo.id);
        });
    },
    jsonImported: function jsonImported(projectId) {
        trade.loadProject(projectId, function (error) {
            if (error === false) {
                console.warn('Project with id ' + projectId + ' could not be loaded.');
                console.error(error.toString());
            }
        });
    }
});

/**
 * server event listener
 */
events.addServerListener('keyUpdated', function () {
    // TODO more client changes are coming, we'll finish the code below then
    //if (projectId === projectConfig.projectId) {
    //    existingKeys[keyName] = undefined; // save the key // what's happening here?
    //    var data = {};
    //    data[keyName] = keyValue;
    //    translationView.printBundleTemplate([data], language, availableLanguages, projectConfig.project);
    //}
});

/**
 * server event listener
 * all users will be notified of changes
 */
events.addServerListener('onKeyCloned', function () {
    console.log('events.listener::onKeyCloned' + [].slice.call(arguments));
});

/**
 * server event listener
 */
events.addServerListener('keyDeleted', function (bundleName, obj) {
    // TODO more client changes are coming, we'll finish the code below then
    //if (bundleName === projectConfig.project) {
    //    console.log('translationViewController:keyRenamed', bundleName, obj);
    //    toast.showMessage('Key deleted!' + obj.key);
    //    translationView.markKeyAsRemoved(obj.key);
    //}
});

events.addServerListener('categoryDeleted', function (bundleName, obj) {
    console.log('events.listener::categoryDeleted' + [].slice.call(arguments));
});

events.addServerListener('categoryRenamed', function (bundleName, obj) {
    console.log('events.listener::categoryRenamed' + [].slice.call(arguments));
});

/**
 * server event listener
 */
events.addServerListener('imageRemoved', function (bundleName, categoryName) {
    if (bundleName === projectInfo.id) {
        toast.showMessage('Image removed for category: ' + categoryName);
        translationView.removeImage(categoryName);
    }
});

/**
 * Get word count for given category and language
 * @param category
 * @param lang
 * @returns Number
 */
function countWordsInCategory(category, lang) {
    var wordCount = 0;
    Object.keys(projectConfig.keys[lang]).forEach(function (key) {
        if (key.split('_')[0] === category) {
            wordCount += wordCounter.countWordsInString(projectConfig.keys[lang][key]);
        }
    });
    return wordCount;
}

/**
 * Update overall word-count view for category language
 * @param catId
 * @param lang
 */
function updateCategoryWordCount(catId, lang) {
    translationView.updateCategoryWordCount({
        id: catId,
        language: lang,
        words: countWordsInCategory(catId, lang)
    });
}

/**
 * Filter category names by iterating through project keys
 * @param keys
 * @returns Array
 */
function getCategoriesByKeys(keys) {
    var currentCatName,
        defaultKeys,
        categories = [];
    for (var lang in keys) {
        if (keys.hasOwnProperty(lang)) {
            defaultKeys = keys[lang];
            for (var key in defaultKeys) {
                if (defaultKeys.hasOwnProperty(key)) {
                    currentCatName = key.split('_')[0];
                    if (categories.indexOf(currentCatName) === -1) {
                        categories.push(currentCatName);
                    }
                }
            }
        }
    }
    return categories;
}

/**
 * Removes category related keys from "session" data - stored in projectConfig.keys
 * (member var declared on top of this file)
 * Invoked by category was removed
 * @param category
 */
function removeCategoryData(category) {
    Object.keys(projectConfig.keys).forEach(function (lang) {
        var langData = projectConfig.keys[lang];
        Object.keys(langData).forEach(function (key) {
            if (key.split('_')[0] === category) {
                delete langData[key];
            }
        });
    });
}

function handleNewProjectConfig(newProjectConfig, project) {
    // project specific config
    console.log('translationViewController get new config', newProjectConfig);
    // n.b. nothing is saved here - "saving" only happens as in "store in our data structure"
    saveProjectConfig(newProjectConfig, project);
    // before there was a check do not clear the view if the actual project is the same.
    // The problem is if you remove a key in the editor view than the translation view can't
    // detect this.
    translationView.clearView();
    canny.flowControl.show('resourceBundle');
}

function renderProject(projectData, project, cb) {
    var categories = getCategoriesByKeys(projectData.keys);

    handleNewProjectConfig(projectData, project);

    Object.keys(projectData.keys).forEach(function (lang) {
        var sorted,
            datas = [];
        Object.keys(projectData.keys[lang]).forEach(function (key) {
            datas.push({
                key: key,
                value: projectData.keys[lang][key]
            });
        });
        sorted = datas.sort(sortByKey);

        sorted.forEach(function (data) {
            existingKeys[data.key] = undefined;
        });

        // TODO projectConfig.project will be removed if the trade call moved to this controller
        translationView.printBundleTemplate(sorted, lang, availableLanguages, cb || function () {});

        categories.forEach(function (category) {
            updateCategoryWordCount(category, lang);
        });
    });
}

module.exports = {
    renameCategory: function renameCategory(oldName, newName) {
        toast.showMessage('Renamed category ' + oldName + ' to ' + newName + '!');
        translationView.renameCategory(oldName, newName, availableLanguages);
    },
    removeCategory: function removeCategory(catName) {
        toast.showMessage('Removed category ' + catName + '!');
        removeCategoryData(catName);
        translationView.removeCategory(catName);
    },
    /**
     * is called if the user rename key request was successful
     * @param newKey
     * @param oldKey
     */
    renameKey: function renameKey(oldKey, newKey) {
        if (oldKey) {
            toast.showMessage('Key renamed successful! From ' + oldKey + ' to ' + newKey);
            translationView.renameKey(oldKey, newKey, availableLanguages);
        } else {
            toast.showMessage('Key renamed failed!');
        }
    },
    removeKey: function removeKey(key) {
        toast.showMessage('Key removed successful!', key);
        translationView.removeKey(key);
    },
    imageRemoved: function imageRemoved(categoryName) {
        toast.showMessage('Image removed for category: ' + categoryName);
        translationView.removeImage(categoryName);
    },
    /**
     * Will be called with the complete JSON object from a specific project
     * @param projectData
     */
    onLoadProject: function onLoadProject(projectData, project) {
        orderedLanguages = projectData.availableLanguages;
        var anchor = url.hasAnchor() ? url.getAnchor().replace('#', '') : false;
        renderProject(projectData, project, function (viewId) {
            if (anchor) {
                if (viewId === anchor) {
                    var dom = document.getElementById(translationView.config.rowPrefix + viewId);
                    // do the element exists?
                    if (dom) {
                        uiEvents.callUievent('anchorFocus', url.getAnchor());
                        setTimeout(function () {
                            var bodyRect = document.body.getBoundingClientRect(),
                                elemRect = dom.getBoundingClientRect(),
                                offset = elemRect.top - bodyRect.top;
                            window.scrollTo(0, offset);
                        }, 1000);
                    }
                }
            }
        });
        // add the descriptions
        canny.translationViewDescription.addDescriptions(projectData.keyDescriptions);
        Object.keys(projectData.images).forEach(function (key) {
            // images without a slash at front are old image upload - this is only to be backward compatible
            var url = projectData.images[key][0] === '/' ? projectData.images[key] : '/' + project.id + '/' + projectData.images[key];
            canny.translationViewImageUpload.appendImage(key, url);
        });
    },
    onNewProjectCreated: function onNewProjectCreated(projectData, project) {
        orderedLanguages = projectData.availableLanguages;
        renderProject(projectData, project);
    }
};

},{"../events.js":18,"../trade.js":22,"../uiEventManager.js":23,"../uiModules/translationView":41,"../uiModules/translationViewImageUpload":43,"../util/url":46,"../util/wordCounter":47,"canny":52,"dom-opts":65}],16:[function(require,module,exports){
'use strict';

/**
 * controller for the image uplaoder view - calls the server to upload a image and notifier the ui event handler
 * @type {{}}
 */
var canny = require('canny'),
    upload = canny.upload,
    displayManager = canny.displayManager,
    uiEvents = require('../uiEventManager.js'),
    uploadId,
    projectInfo;
/**
 * Call this for each file - will call a call back with the server answer
 * @param file
 */
function sendFile(file, directCallback) {
    var uri = '/uploadFile?projectId=' + projectInfo.id + '&key=' + uploadId + '&project=' + projectInfo.name,
        xhr = new XMLHttpRequest(),
        fd = new FormData();

    xhr.open("POST", uri, true);
    xhr.onreadystatechange = function () {
        var data;
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Handle response.
            data = JSON.parse(xhr.responseText);
            directCallback && directCallback(data); // handle response.
            // {file: "//sub/sub1/sub1_blue_coke.jpg", name: "sub1_blue_coke.jpg", type: "image/jpg"}
            console.log(data);
            uiEvents.callUievent('fileUploaded', projectInfo.id, uploadId, data.file);
        }
    };
    fd.append('myFile', file);
    // Initiate a multipart/form-data upload
    xhr.send(fd);
}

/**
 * Save data in member variable used by further upload operations
 * @param data: Project data
 */
function applyProjectData(data, project) {
    projectInfo = project;
}

uiEvents.addUiEventListener({
    showFileUpload: function showFileUpload(id) {
        uploadId = id;
        displayManager.show('uploadView');
    }
});

upload.onUpload(function (file) {
    // TODO additional to the upload id we need the project ID
    console.log('uploadController:upload id: file:', uploadId, file);
    sendFile(file);
});

module.exports = {
    onNewProjectCreated: applyProjectData,
    onLoadProject: applyProjectData
};

},{"../uiEventManager.js":23,"canny":52}],17:[function(require,module,exports){
'use strict';

var trade = require('../trade'),
    uiEvents = require('../uiEventManager'),
    url = require('../util/url');
/**
 * TODO handle the browser back and next button and load the correct view
 */
function processAjaxData(response, urlPath) {
    document.title = response.pageTitle;
    window.history.pushState({
        "html": response.html,
        "pageTitle": response.pageTitle,
        id: response.id,
        isProject: response.isProject
    }, "", urlPath + url.getAnchor());
}

/**
 * Manipulate browser history / location with given project data
 * @param data: Project related data
 */
function applyProjectData(data, project) {
    // add the project path to the URL
    if (project.name) {
        processAjaxData({
            pageTitle: project.id,
            html: '',
            id: project.id,
            isProject: true
            // to persists the links we save the id in URL - it's not human readable but links will work forever
        }, '/' + project.id + '.prj');
    }
}

uiEvents.addUiEventListener({
    anchorFocus: function anchorFocus(id) {
        // set the anchor to the URL
        window.history.pushState(null, null, id);
    }
});

window.onpopstate = function (e) {
    //    console.log('onpopstate', e.state.id);
    if (e.state) {
        if (e.state.isProject) {
            trade.loadProject(e.state.id, function (err) {
                if (err === false) console.error('urlManipulator:loadProject fails for projectId:', e.state.id);
            });
        } else {
            trade.getDirectory(e.state.id, function (err) {
                if (err !== false) {
                    // TODO call the
                    uiEvents.callUievent('showOverviewPage');
                } else {
                    console.log('urlManipulator:getDirectory can not load project for directory name:', e.state.id);
                }
            });
        }
    }
};

/**
 * TODO there is a problem with activating the project view or the overview page...
 *
 * just the implementation of the callbacks
 *
 */
module.exports = {
    onLoadProject: applyProjectData,
    onNewProjectCreated: applyProjectData,
    getDirectory: function getDirectory(data) {
        processAjaxData({
            pageTitle: 'translatron overview',
            html: '',
            id: data.currentDirectory,
            isProject: false
        }, data.currentDirectory);
    }
};

},{"../trade":22,"../uiEventManager":23,"../util/url":46}],18:[function(require,module,exports){
'use strict';

/**
 * Created by eightyfour.
 *
 * All server events. Multiple clients can register on each event
 * and will be notified if method is called from server.
 *
 * TODO RENAME FILE
 * TODO to what? :)
 * What about "externalChangeNotifications"?
 *
 * TBD why don't we integrate this one with ui events? that would cut down on the number of components we have and we "only" (?)
 * have to do some sensible renaming of events, like renaming all events handled here by adding "external" or similar
 * (e.g. "keyUpdated" becomes "keyUpdatedExternally").
 */
var events = function () {
    "use strict";

    var eventQueue = {},
        callQueue = function callQueue(name, args) {
        console.log('got notification for ', name, 'with payload', args);
        if (eventQueue.hasOwnProperty(name)) {
            eventQueue[name].map(function (fc) {
                fc.apply(null, args);
            });
        }
    };
    return {
        serverEvents: {
            // TBD can be removed?
            sendFile: function sendFile() {
                callQueue('sendFile', [].slice.call(arguments));
            },
            // TBD can be removed?
            sendPathList: function sendPathList() {
                callQueue('sendPathList', [].slice.call(arguments));
            },
            keyUpdated: function keyUpdated(projectId, language, keyName, keyValue) {
                callQueue('keyUpdated', [projectId, language, keyName, keyValue]);
            },
            onKeyCloned: function onKeyCloned(projectId, data) {
                callQueue('onKeyCloned', [projectId, data]);
            },
            keyRenamed: function keyRenamed(projectId, oldKeyName, newKeyName) {
                callQueue('keyRenamed', [projectId, oldKeyName, newKeyName]);
            },
            /**
             * @param bundleObj {locale: string, bundle: string}
             * @param data {oldKey:string, newKey: string}
             */
            keyDeleted: function keyDeleted(projectId, keyName) {
                callQueue('keyDeleted', [projectId, keyName]);
            },
            imageRemoved: function imageRemoved(projectId, categoryName) {
                callQueue('imageRemoved', [projectId, categoryName]);
            },
            newProjectWasCreated: function newProjectWasCreated(projectId) {
                callQueue('newProjectWasCreated', [projectId]);
            },
            categoryRenamed: function categoryRenamed(projectId, oldName, newName) {
                callQueue('categoryRenamed', [projectId, oldName, newName]);
            },
            categoryDeleted: function categoryDeleted(projectId, catName) {
                callQueue('categoryDeleted', [projectId, catName]);
            },
            newDirectoryCreated: function newDirectoryCreated(directoryId) {
                callQueue('newDirectoryCreated', [directoryId]);
            },
            projectDescriptionUpdated: function projectDescriptionUpdated(projectId, id, description) {
                callQueue('projectDescriptionUpdated', [projectId, id, description]);
            }
        },
        addServerListener: function addServerListener(name, cb) {
            if (eventQueue.hasOwnProperty(name)) {
                eventQueue[name].push(cb);
            } else {
                eventQueue[name] = [cb];
            }
        }
    };
}();

module.exports = events;

},{}],19:[function(require,module,exports){
'use strict';

var C = require('./CONST');
var connectionLost = require('./uiModules/connectionLost');

/**
 * Refresh the user session and detects if the user is not authenticated anymore
 * useful for:
 *  * session keep alive
 *  * detect if the user is not authenticated anymore
 *  * detects server shut down
 */
module.exports = function handleSessionTimeOut() {
    var connectionLostUi = connectionLost({
        onReload: function onReload() {
            return location.reload();
        },
        onClose: function onClose() {
            return connectionLostUi.destroy();
        }
    });
    var interval = setInterval(function () {
        fetch(location.protocol + '//' + location.host + '/touchSession', {
            credentials: "same-origin"
        }).then(function (d) {
            if (d.status === 401) {
                clearInterval(interval);
                // whoops server has no authentication anymore...
                connectionLostUi.render('AUTH');
            }
        }).catch(function (e) {
            clearInterval(interval);
            connectionLostUi.render('SERVER_DOWN', 'Maybe a server restart happens. Please try to login again in few minutes');
        });
    }, C.SESSION.renewal_interval_in_ms);
};

},{"./CONST":2,"./uiModules/connectionLost":30}],20:[function(require,module,exports){
'use strict';

/*global domOpts */
/*jslint browser: true */
var unicode = require('./unicode.js');
var toast = require('./Toast.js');
var canny = require('canny');
var trade = require('./trade.js');
var handleSessionTimeOut = require('./handleSessionTimeOut');
var breadCrumbController = require('./controller/breadcrumbController.js');

window.domOpts = window.domOpts || require('dom-opts');
// made it public - just for development
window.canny = canny;

canny.add('repeat', require('canny/mod/repeat'));
canny.add('whisker', require('canny/mod/whisker'));
canny.add('async', require('canny/mod/async'));
canny.add('flowControl', require('canny/mod/flowControl')('flowControl'));
canny.add('displayManager', require('./uiModules/displayManager.js'));
canny.add('textEditor', require('./textEditor.js'));
canny.add('cookieManager', require('canny-cookieManager-lib'));

canny.add('texts', require('./uiModules/texts.js'));
canny.add('auth', require('./uiModules/auth.js'));
canny.add('projectMainNavigation', require('./uiModules/projectMainNavigation.js'));
canny.add('translationView', require('./uiModules/translationView.js'));
canny.add('translationViewImageUpload', require('./uiModules/translationViewImageUpload.js'));
//canny.add('translationViewHeader',  require('./uiModules/translationViewHeader.js'));
canny.add('imageViewer', require('./uiModules/imageViewer.js'));
canny.add('projectOverview', require('./uiModules/projectOverview.js'));
canny.add('createNewProject', require('./uiModules/createNewProject.js'));
canny.add('menuRight', require('./uiModules/menuRight.js'));
canny.add('anchorMenu', require('./uiModules/anchorMenu.js'));

canny.add('translationViewDescription', require('./uiModules/translationViewDescription.js'));
canny.add('upload', require('./uiModules/upload.js'));
canny.add('JMBFUploader', require('./uiModules/JMBFUploader.js'));
canny.add('JsonImport', require('./uiModules/JsonImport.js'));

trade.addController(require('./controller/projectMainNavigationController.js'));
trade.addController(require('./controller/pageHeaderController.js'));
trade.addController(require('./controller/translationViewController.js'));
trade.addController(require('./controller/textEditorController.js'));
trade.addController(require('./controller/urlManipulator.js'));
trade.addController(require('./controller/projectOverviewController.js'));
trade.addController(require('./controller/createNewProjectController.js'));
trade.addController(breadCrumbController);
trade.addController(require('./controller/authController.js'));
trade.addController(require('./controller/menuRightController.js'));
trade.addController(require('./controller/uploadController.js'));
trade.addController(require('./controller/JMBFUploaderController.js'));
trade.addController(require('./controller/JsonImportController.js'));

canny.ready(function () {
    "use strict";
    // create websocket connection via trade

    trade.initialize(function (userObject, sessionsEnabled) {

        if (userObject === null) {
            alert('A fatal error happens while loading the view');
            location.reload();
            return;
        }
        canny.texts.setTexts({ userName: userObject.name });

        if (userObject.isAdmin) {
            document.body.classList.add('isAdmin');
        }

        if (sessionsEnabled) {
            // trigger a "session keep alive" and detects if the user is not authenticated anymore or the server is down
            handleSessionTimeOut();
        }
    });
});

window.canny = canny;
window.domOpts = require('dom-opts');
window.unicode = unicode;
window.toast = toast;

// QUESTION: can it happen that the above call to trade.initialize (in canny.ready) finishes earlier than the next lines?
// i.e. the callback for trade.ready will never be executed? if yes: why not pass the callback already to trade.initialize?
trade.ready(function () {
    'use strict';

    var prj = function getProjectNameAndPathFromURL() {
        var split = location.pathname.split('/');
        var path = location.pathname;
        var prjName = void 0;

        if (/\.prj/.test(split[split.length - 1])) {
            // remove .prj extension and first slash
            prjName = path.replace('.prj', '').replace('/', '');
            path = split.slice(0, -1).join('/');
        }

        if (path[0] !== '/') {
            path = '/' + path;
        }

        return {
            path: path,
            projectId: prjName
        };
    }();

    // QUESTION: since this is working on the URL the application was loaded with and this URL can be either a directory URL
    // or a project URL: why can't we decide first what we actually have in the URL and then either call getDirectory
    // or loadProject? ANSWER: depends. if the URL points to a directory, we only have to do the getDirectory call.
    // if the URL is a project, two calls have to be made: one loadProject call and one extra getDirectory call for the
    // parent of the project (mainly for navigation component which needs to know the siblings of the project). But: take
    // care that this extra getDirectory must *not* change the state of the breadcrumb trail (that one should still show
    // the selected project)


    if (prj.projectId) {
        // this is the initial call to trigger a project load - you will get
        // the project.json and all translations
        trade.loadProject(prj.projectId, function (err, data, project) {
            // callback is only called if an error occurs
            if (err !== null) {
                toast.showMessage('Loading project \'' + prj.projectId + '\' failed - project doesn\'t exists');
                console.error('translationViewController:loadProject fails for projectId:', prj.projectId);
            } else {
                // required for the breadcrumb
                breadCrumbController.setPath(project.url);
            }
        });
    } else {
        trade.getDirectory(prj.path, function (obj) {});
    }
});

},{"./Toast.js":3,"./controller/JMBFUploaderController.js":4,"./controller/JsonImportController.js":5,"./controller/authController.js":6,"./controller/breadcrumbController.js":7,"./controller/createNewProjectController.js":8,"./controller/menuRightController.js":9,"./controller/pageHeaderController.js":11,"./controller/projectMainNavigationController.js":12,"./controller/projectOverviewController.js":13,"./controller/textEditorController.js":14,"./controller/translationViewController.js":15,"./controller/uploadController.js":16,"./controller/urlManipulator.js":17,"./handleSessionTimeOut":19,"./textEditor.js":21,"./trade.js":22,"./uiModules/JMBFUploader.js":24,"./uiModules/JsonImport.js":25,"./uiModules/anchorMenu.js":26,"./uiModules/auth.js":27,"./uiModules/createNewProject.js":31,"./uiModules/displayManager.js":32,"./uiModules/imageViewer.js":34,"./uiModules/menuRight.js":36,"./uiModules/projectMainNavigation.js":38,"./uiModules/projectOverview.js":39,"./uiModules/texts.js":40,"./uiModules/translationView.js":41,"./uiModules/translationViewDescription.js":42,"./uiModules/translationViewImageUpload.js":43,"./uiModules/upload.js":44,"./unicode.js":45,"canny":52,"canny-cookieManager-lib":51,"canny/mod/async":53,"canny/mod/flowControl":54,"canny/mod/repeat":55,"canny/mod/whisker":56,"dom-opts":65}],21:[function(require,module,exports){
'use strict';

/**
 * textEditor
 */
(function () {
    "use strict";

    var textEditor = function () {

        var texts = {
            originText: 'Double click to edit this text',
            editBtn: 'Edit',
            cancelBtn: 'Cancel',
            changeBtn: 'Save changes'
        },
            onChangeAllList = [];

        function findClosestAncestorWithId(element) {
            while ((element = element.parentElement) && !element.id) {}
            return element;
        }

        function callChangeList(id, value, fc) {
            onChangeAllList.forEach(function (cb) {
                return cb(id, value, fc);
            });
        }

        function editWithTextarea(node, buttonWrap, obj) {
            var open = false,
                divWrapper = document.createElement('div'),
                button = document.createElement('div'),
                cancelButton = document.createElement('div'),
                area = document.createElement('textarea'),
                jsTextN;

            if (obj && obj.hasOwnProperty('placeholder')) {
                area.setAttribute('placeholder', obj.placeholder);
            }

            function close() {
                node.classList.add('textEditor-hide');
                open = false;
            }

            function edit() {
                if (!open) {
                    jsTextN = node.querySelector('.js-text');
                    open = true;
                    area.value = jsTextN.innerHTML;
                    setTimeout(function () {
                        node.classList.remove('textEditor-hide');
                    }, 100);
                }
            }

            // set classes
            cancelButton.className = 'textEditor-button textEditor-button-cancel octicon octicon-x';
            button.className = 'textEditor-button textEditor-button-change octicon octicon-check';
            area.className = 'textEditor-area';
            divWrapper.className = 'textEditor-wrap-area';
            node.classList.add('textEditor-hide');

            // register listeners
            cancelButton.addEventListener('click', close);
            button.addEventListener('click', function () {
                var val = area.value,
                    id = findClosestAncestorWithId(this).id,
                    ret = callChangeList(id, val, function (success) {
                    if (success) {
                        jsTextN.innerHTML = val;
                        close();
                    } else {
                        console.warn('textEditor:toTextareaNode text not accepted! Ignore changes.');
                    }
                });
            });
            node.addEventListener('dblclick', edit);

            // set titles
            node.setAttribute('title', texts.originText);
            cancelButton.setAttribute('title', texts.cancelBtn);
            button.setAttribute('title', texts.changeBtn);

            // append to wrapper div
            divWrapper.appendChild(area);
            buttonWrap.appendChild(cancelButton);
            buttonWrap.appendChild(button);

            // append to parent
            node.appendChild(divWrapper);

            // return click function
            return function () {
                if (!open) {
                    // show input
                    edit();
                } else {
                    // show text
                    close();
                }
            };
        }

        return {
            /**
             * Register a function to a specific editor.
             * If the function returns undefined than the editor expect that the passed callback
             * is called with true or false. If the method returns true the text will change.
             * If the method returns false the text is not changed.
             *
             * @param id
             * @param fc <- is called with (textValue, callbackFunction) can return undefined, false and true
             */
            onChange: function onChange(fc) {
                onChangeAllList.push(fc);
            },
            /**
             *
             * @param node
             * @param id
             */
            add: function add(node, obj) {
                var buttonWrap = document.createElement('div'),
                    editIconButton = document.createElement('div');
                buttonWrap.className = 'textEditor-buttonWrap';
                editIconButton.className = 'textEditor-button textEditor-button-edit octicon octicon-pencil';
                editIconButton.addEventListener('click', editWithTextarea(node, buttonWrap, obj));
                editIconButton.setAttribute('title', texts.editBtn);
                // append editIconButton to parent
                node.classList.add('textEditor-main-wrap');
                buttonWrap.appendChild(editIconButton);
                node.appendChild(buttonWrap);
            }
        };
    }();

    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) {
        module.exports = textEditor;
    } else {
        canny.add('textEditor', textEditor);
    }
})();

},{}],22:[function(require,module,exports){
'use strict';

/*jslint browser: true */
/**
 * handle the connection between server and client
 */
var canny = require('canny');
var events = require('./events.js');
var shoe = require('shoe');
var dnode = require('dnode');
var connectionLost = require('./uiModules/connectionLost/index.js');

window.domOpts = window.domOpts || require('dom-opts');

/**
 * Some of the callbacks are handled via the registered controller - addController method.
 */
var trade = function () {
    "use strict";
    // ready queue call registered call backs when trade is ready

    var cbs = [],
        server,
        registeredController = [],

    // this flag should be true if there is a stable server connection
    hasServerConnection = false,
        tryToReconnect = false,
        connectionLostUi = connectionLost({
        onReload: function onReload() {
            return location.reload();
        },
        onReconnect: function onReconnect() {
            tryToReconnect = true;
            connectionLostUi.showProgress();
            stream = shoe('/trade');
            createConnection(function (userObject, sessionsEnabled) {
                if (userObject === null) {
                    // this is the case when the session ends on server side
                    connectionLostUi.render('RECONNECT_FAIL');
                } else {
                    connectionLostUi.destroy();
                    tryToReconnect = false;
                }
            });
        },
        onClose: function onClose() {
            connectionLostUi.destroy();
        }
    });
    var stream = shoe('/trade');
    var d = void 0;

    function init(s, fc) {
        server = s;

        if (server.setUserRights) {
            server.setUserRights(canny.cookieManager.forSessionCookie('translatron_session').getValues(), fc);
        } else {
            fc({ name: 'Logout', isAdmin: true }, false);
        }

        server.attachClientCallbacks(events.serverEvents);
        // call ready queue
        cbs.map(function (cb) {
            cb && cb();
            return null;
        });
    }

    function createConnection(fc) {
        d = dnode();
        d.on('remote', function (server) {
            hasServerConnection = true;
            init(server, fc);
        });
        d.on('fail', function (err) {
            console.log(err);
            hasServerConnection = false;
            connectionLostUi.render('CONNECTION_FAIL');
        });
        d.on('error', function (err) {
            console.log(err);
            // something happens
            // e.g. a UI update throws an exception
            hasServerConnection = false;
            connectionLostUi.render('EXCEPTION', err.name);
        });
        d.on('end', function (err) {
            // this is called if the connection is closes from server
            hasServerConnection = false;
            console.error('trade:end', err);
            // the setTimeout is for avoid flickering if page reload via e.g. F5
            if (tryToReconnect) connectionLostUi.render('RECONNECT_FAIL');else setTimeout(function () {
                return connectionLostUi.render('CONNECTION_END');
            }, 1000);
        });
        d.pipe(stream).pipe(d);
    }
    /**
     * Check if connection is available - otherwise send view error
     * @returns {boolean}
     */
    function isConnected() {
        if (hasServerConnection) return true;
        connectionLostUi.render('RECONNECT');
        return false;
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
                    console.log('controller:', functionName);
                    controller[functionName].apply(null, args);
                } catch (e) {
                    connectionLostUi.render('FATAL', e.message);
                    console.error(e);
                }
            }
        });
    }

    return {
        initialize: function initialize(fc) {
            createConnection(fc);
        },
        addController: function addController(obj) {
            registeredController.push(obj);
        },
        /**
         * Load the whole project files with all required data (project specific json)
         * @param {string} projectId
         * @param {function} cb
         */
        loadProject: function loadProject(projectId, cb) {
            server.loadProject(projectId, function (data, _ref) {
                var id = _ref.id,
                    name = _ref.name,
                    url = _ref.url;

                if (data) {
                    // overwrite project id
                    data.projectId = id;
                    data.project = name;
                    callController('onLoadProject', [data, { id: id, name: name, url: url }]);
                    cb && cb(null, data, { id: id, name: name, url: url });
                } else {
                    // callback a error so the caller has the control about error handling
                    // TODO refactor code and make use of error object instead of false - and pass empty object to other args instead of nothing
                    cb && cb(false);
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
        createKey: function createKey(projectId, language, keyAndValue, cb) {
            if (isConnected()) server.saveKey(projectId, language, keyAndValue, function (err, key, value) {
                // TODO handle error case
                if (!err) {
                    cb(projectId, language, key, value);
                    callController('onCreateKey', [projectId, language, key, value]);
                }
            });
        },
        /**
         *
         * @param projectId
         * @param {{id :string, sourceCategory:string, targetCategory:string}} keyAndValue
         * @param cb
         */
        cloneKey: function cloneKey(projectId, keyAndValue, cb) {
            if (isConnected()) server.cloneKey(projectId, keyAndValue, function (err, projectId, data) {
                cb(err, projectId, data);
                callController('onKeyCloned', [projectId, data]);
            });
        },
        /**
         * Save changes to a key's value. Change will be broadcast to other clients.
         * @param {string} projectId
         * @param {string} language
         * @param {{key:string, value:string}} keyAndValue
         * @param {function} cb - callback to execute after saving
         */
        saveKey: function saveKey(projectId, language, keyAndValue, cb) {
            if (isConnected()) server.saveKey(projectId, language, keyAndValue, function (err, key, value) {
                // TODO handle error case
                if (!err) {
                    cb(projectId, language, key, value);
                }
            });
        },
        /**
         *
         * @param {string} projectName
         * @param currentDirId if of the directory in which the new project will be created
         */
        createNewProject: function createNewProject(projectName, currentDirId) {
            if (isConnected()) server.createNewProject(currentDirId, projectName, {}, function (err, projectData, project) {
                // TODO handle error case
                if (!err) {
                    callController('onNewProjectCreated', [projectData, project]);
                }
            });
        },
        /**
         *
         * @param {string} directoryName
         * @param {string} currentDirectory
         */
        createNewDirectory: function createNewDirectory(directoryName, currentDirectory) {
            if (isConnected()) server.createNewDirectory(directoryName, currentDirectory, function (err, directoryData) {
                // TODO handle error case
                if (!err) {
                    callController('onNewDirectoryCreated', [directoryData]);
                }
            });
        },
        /**
         * Renames a category.
         * @param {string} projectId
         * @param {string} oldName
         * @param {string} newName
         */
        renameCategory: function renameCategory(projectId, oldName, newName) {
            if (isConnected()) server.renameCategory(projectId, oldName, newName, function (err, oldName, newName) {
                if (!err) {
                    callController('renameCategory', [oldName, newName]);
                }
            });
        },
        /**
         * Removes a category with all it's child keys.
         * @param {string} projectId
         * @param {string} catName
         */
        removeCategory: function removeCategory(projectId, catName) {
            if (isConnected()) server.removeCategory(projectId, catName, function (err, catName) {
                if (!err) {
                    callController('removeCategory', [catName]);
                }
            });
        },
        /**
         * Renames a key for all languages
         * @param {string} projectId
         * @param {{newKey: string, oldKey: string}} obj
         */
        renameKey: function renameKey(projectId, obj) {
            if (isConnected()) server.renameKey(projectId, {
                newKey: obj.newKey,
                oldKey: obj.oldKey
            }, function (err, oldKey, newKey) {
                if (!err) {
                    callController('renameKey', [oldKey, newKey]);
                } else {
                    callController('renameKey', [false]);
                }
            });
        },
        /**
         * Removes a key for all languages.
         * @param {string} projectId
         * @param {string} keyName
         * @param {function} cb
         */
        removeKey: function removeKey(projectId, keyName, cb) {
            if (isConnected()) server.removeKey(projectId, keyName, function (err, keyName) {
                if (!err) {
                    cb(keyName);
                    callController('removeKey', [keyName]);
                }
            });
        },
        /**
         *
         * @param {string} projectId
         * @param {string} categoryName
         */
        removeImage: function removeImage(projectId, categoryName) {
            if (isConnected()) server.removeImage(projectId, categoryName, function (err, categoryName) {
                if (!err) {
                    callController('imageRemoved', [categoryName]);
                } else {
                    toast.showMessage(err.message);
                }
            });
        },
        /**
         *
         * Get the contents of the directory.
         *
         * @param dir the selected directory.
         * @param cb {projects:[String]:dirs:[String]}
         */
        getDirectory: function getDirectory(dir, cb) {
            if (isConnected()) server.getDirectory(dir, function (err, args) {
                if (err !== null) {
                    toast.showMessage('Internal server error! Please report this message to a developer: ' + err.message);
                    console.error(err.message);
                    return;
                }
                // only call the controller if not false
                cb && cb(args);
                if (args !== false) {
                    callController('getDirectory', [args]);
                }
            });
        },
        /**
         * save the project description
         * @param projectId
         * @param id
         * @param description
         * @param callback
         */
        saveProjectDescription: function saveProjectDescription(projectId, id, description, callback) {
            if (isConnected()) server.saveProjectDescription(projectId, id, description, function (err) {
                if (!err) {
                    callback && callback(true);
                    callController('savedProjectDescription', []);
                } else {
                    callback && callback(false);
                }
            });
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
        moveProject: function moveProject(_ref2, cb) {
            var id = _ref2.id,
                url = _ref2.url,
                name = _ref2.name;

            if (isConnected()) {
                server.moveProject({ id: id, url: url, name: name }, function (err, project) {
                    cb(err, project || {});
                });
            }
        },
        /**
         * TODO summarize projectName + currentDirId to one projectId
         * Delete a project.
         * @param projectName
         * @param currentDirId - @deprecated
         * @param callback
         */
        deleteProject: function deleteProject(id, cb) {
            if (isConnected()) {
                server.deleteProject(id, function (err, project) {
                    if (!err) {
                        // TODO change to: prjName
                        cb && cb(null, project);
                        callController('projectDeleted', [project]);
                    } else {
                        cb && cb(err);
                    }
                });
            }
        },
        /**
         * Delete a project.
         * @param dirName
         * @param currentDirId
         * @param callback
         */
        deleteFolder: function deleteFolder(id, callback) {
            if (isConnected()) server.deleteFolder(id, function (err, dirId) {
                if (!err) {
                    callback && callback(null, dirId);
                    callController('folderDeleted', [dirId]);
                } else {
                    callback && callback(err);
                }
            });
        },
        // Not really tested
        ready: function ready(cb) {
            if (server) {
                cb();
            } else {
                cbs.push(cb);
            }
        }
    };
}();

module.exports = trade;

},{"./events.js":18,"./uiModules/connectionLost/index.js":30,"canny":52,"dnode":63,"dom-opts":65,"shoe":95}],23:[function(require,module,exports){
"use strict";

var uiEvent = function () {
    var eventQueues = {
        activateLanguage: [],
        deActivateLanguage: [],
        addLanguage: [],
        showExportDialog: [],
        projectSelected: [],
        showOverviewPage: [],
        updateKey: [],
        anchorFocus: [],
        enableEditorMode: [],
        toggleWordCount: [],
        showFileUpload: [],
        showJMBFUploader: [],
        showJSONImport: [],
        JMBFFileUploaded: [],
        jsonImported: [],
        fileUploaded: []
    };
    return {
        addUiEventListener: function addUiEventListener(obj) {
            Object.keys(obj).forEach(function (key) {
                if (eventQueues.hasOwnProperty(key)) {
                    eventQueues[key].push(obj[key]);
                }
            });
        },
        callUievent: function callUievent(eventName, args) {
            var argsList = [].slice.call(arguments, 1, arguments.length);
            if (eventQueues.hasOwnProperty(eventName)) {
                eventQueues[eventName].forEach(function (fc) {
                    fc.apply(null, argsList);
                });
            }
        }
    };
}();

module.exports = uiEvent;

},{}],24:[function(require,module,exports){
'use strict';

/**
 * shows the uploader form to upload a image to the server
 */
var _onUpload = function onUpload() {},
    brain = {
    fileInput: {
        init: function init(node) {
            node.addEventListener('change', upload);
        }
    }
};

function upload() {
    console.log('c-upload:trigger upload');
    var file = this.files[0];
    if (file) {
        // send it direct after drop
        [].slice.call(this.files).forEach(function (file) {
            // TODO instead pass  directly a array of files - so we save POST calls
            _onUpload(file);
        });
        // cleanup value otherwise file with same name can't uploaded again
        this.value = null;
        return false;
    }
}
/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = {
    onUpload: function onUpload(fc) {
        _onUpload = fc;
    },
    add: function add(node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr].init(node);
        }
    }
};

},{}],25:[function(require,module,exports){
'use strict';

/**
 * shows the uploader form to upload a image to the server
 */
var _onUpload = function onUpload() {},
    brain = {
    fileInput: {
        init: function init(node) {
            node.addEventListener('change', upload);
        }
    }
};

function upload() {
    var file = this.files[0];
    if (file) {
        // send it direct after drop
        [].slice.call(this.files).forEach(function (file) {
            // TODO instead pass  directly a array of files - so we save POST calls
            _onUpload(file);
        });
        // cleanup value otherwise file with same name can't uploaded again
        this.value = null;
        return false;
    }
}
/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = {
    onUpload: function onUpload(fc) {
        _onUpload = fc;
    },
    add: function add(node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr].init(node);
        }
    }
};

},{}],26:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * anchorMenu
 *
 * TODO show the actual frame:
 *  * detect which dome categories in dom are in view and add a classes to the menu ul category.
 *      * the expected effect will be look like a frame which categories are in view
 *      * first-child border-top last-child border bottom and the rest border left and right will give a frame effect
 *
 *  do it for all c-anchorMenu-parent element which could be found in view
 *
 * The anchor menu shows all elements which have the class c-anchorMenu-parent as parent and searches for children
 * with class c-anchorMenu-child. It renders a ul li list and registered a click call to throw a click event with the id.
 *
 * @type {exports}
 */
var util = require('../util/url'),
    translationViewConfig = require('./translationView').config,
    rootNode,
    parentNodeList = [],
    _onSelect = function onSelect() {},
    shrinkOffsetForViewDetection = 100,
    highlightTopMostKey = function () {

    var highlightedItem;

    /**
     * check if node is aligned top most in the browser view
     * @param obj
     */
    return function () {

        var firstOpenCategory = rootNode.querySelector('li.c-inView'),
            currentMainViewCategoryNode,
            currentMainViewCategoryChildNodes,
            mainViewTopMostKeyNode;

        if (!firstOpenCategory) {
            return;
        }

        // Reset previous highlighted item
        if (highlightedItem) {
            highlightedItem.classList.remove('c-key-highlight');
        }

        // Highlight topmost item
        currentMainViewCategoryNode = document.body.querySelector('#' + translationViewConfig.rowPrefix + firstOpenCategory.attributes.data.nodeValue.replace('anchor_', ''));
        if (currentMainViewCategoryNode) {
            currentMainViewCategoryChildNodes = currentMainViewCategoryNode.querySelectorAll('.c-anchorMenu-child');
            mainViewTopMostKeyNode = getFirstElementInViewport(currentMainViewCategoryChildNodes);
        } else {
            console.error('anchorMenu:Can\'t find the category node with id', translationViewConfig.rowPrefix + firstOpenCategory.attributes.data.nodeValue.replace('anchor_', ''));
        }

        if (mainViewTopMostKeyNode) {
            highlightedItem = rootNode.querySelector('[data=anchor_' + mainViewTopMostKeyNode.id.replace(translationViewConfig.rowPrefix, '') + ']');
            if (highlightedItem) {
                highlightedItem.classList.add('c-key-highlight');
            }
        }
    };
}();

function _focusElement(id, elem) {
    var dom;
    // handle the active class from menu
    [].slice.call(rootNode.querySelectorAll('.c-active')).forEach(function (n) {
        n.classList.remove('c-active');
    });
    elem.classList.add('c-active');
    elem.parentNode.parentNode.classList.add('c-active');
    // handle the common dom active class
    [].slice.call(document.querySelectorAll('.c-anchorMenu-focus')).forEach(function (n) {
        n.classList.remove('c-anchorMenu-focus');
    });
    dom = document.getElementById(translationViewConfig.rowPrefix + id);
    if (dom) {
        dom.classList.add('c-anchorMenu-focus');
    } else {
        console.log('anchorMenu:focusElement can\'t find element for a anchor', id);
    }
}
/**
 *
 * @param items [{id : string, children : [string]}]
 */
function addItems(root, items) {
    var ul = document.createElement('ul'),
        anchor = util.getAnchor();
    root.appendChild(ul);
    items.forEach(function (catObj) {
        var li = document.createElement('li'),
            span = document.createElement('span');
        // TODO check with log
        if ((typeof catObj === 'undefined' ? 'undefined' : _typeof(catObj)) !== 'object') {
            console.error('anchorMenu:category needs to be an object', catObj);
        }
        span.appendChild(document.createTextNode(catObj.id));
        li.appendChild(span);
        li.setAttribute('data', 'anchor_' + catObj.id);
        span.addEventListener('click', function () {
            _onSelect(catObj.id);
            _focusElement(catObj.id, li);
        });

        if (catObj.children) {
            addItems(li, catObj.children);
        }
        ul.appendChild(li);
        if ('#' + catObj.id === anchor) {
            _focusElement(catObj.id, li);
        }
    });
}

/**
 * check is the node is in the view
 * @param node
 */
function isNodeInView(node) {
    var yOffset = window.scrollY || window.pageYOffset,
        w = {
        top: yOffset,
        bottom: yOffset + window.innerHeight
    },
        bodyRect = document.body.getBoundingClientRect(),
        elemRect = node.getBoundingClientRect(),
        offset = elemRect.top - bodyRect.top + shrinkOffsetForViewDetection,
        nodeHeight = offset + node.offsetHeight - shrinkOffsetForViewDetection * 2;
    return offset > w.top && offset < w.bottom || // is top frame in view
    nodeHeight > w.top && nodeHeight < w.bottom || // is bottom frame in view
    offset < w.top && nodeHeight > w.bottom; // is top frame above view and bottom frame below view
}

function cutCategories(val) {
    var split = val.split('_');
    if (split.length > 1) {
        split.splice(0, 1);
    }
    return {
        id: val,
        value: split.join('_')
    };
}

function expandCategoriesInView() {
    parentNodeList.forEach(function (obj) {
        var li = rootNode.querySelector('[data=anchor_' + obj.id + ']');
        if (isNodeInView(obj.node)) {
            li.classList.add('c-inView');
        } else {
            li.classList.remove('c-inView');
        }
    });
}

function getFirstElementInViewport(nodes) {
    var keyNode,
        pageScrollOffset = document.body.scrollTop || document.documentElement && document.documentElement.scrollTop,
        i = nodes.length,
        nodeMargin;

    while (i--) {
        keyNode = nodes[i];
        nodeMargin = parseInt(window.getComputedStyle(keyNode, null).marginBottom, 10);
        if (getPageOffsetForElement(keyNode) - nodeMargin * 2 <= pageScrollOffset) {
            return keyNode;
        }
    }

    // Return first key node for current active category
    return nodes[0];
}

function getPageOffsetForElement(elem) {
    var bodyRect = document.body.getBoundingClientRect(),
        elemRect = elem.getBoundingClientRect();
    return elemRect.top - bodyRect.top;
}

module.exports = {
    focusElement: function focusElement(id) {
        var li = rootNode.querySelector('[data=anchor_' + id + ']');
        if (li) {
            _focusElement(id, li);
        }
    },
    onSelect: function onSelect(fc) {
        _onSelect = fc;
    },
    renderMenu: function renderMenu() {
        var catObj = [];
        // clear parent node list
        parentNodeList = [];

        [].slice.call(document.querySelectorAll('.c-anchorMenu-parent')).forEach(function (parent) {
            var id = parent.getAttribute('id'),
                children = [];
            if (id) {
                id = id.replace(translationViewConfig.rowPrefix, '');
                // collect parents
                parentNodeList.push({ node: parent, id: id });

                [].slice.call(parent.querySelectorAll('.c-anchorMenu-child')).forEach(function (child) {
                    var id = child.getAttribute('id');
                    if (id) {
                        children.push(cutCategories(id.replace(translationViewConfig.rowPrefix, '')));
                    }
                });
                catObj.push({ id: id, children: children });
            }
        });
        [].slice.call(rootNode.children).forEach(function (child) {
            child.parentNode.removeChild(child);
        });
        addItems(rootNode, catObj);
        rootNode.children[0].style.height = window.innerHeight - 125 + 'px';

        // time delayed trigger the init view
        setTimeout(function () {
            expandCategoriesInView();
            highlightTopMostKey();
        }, 1000);
    },
    add: function add(node, attr) {
        rootNode = node;
    },
    ready: function ready() {
        window.addEventListener('scroll', function (e) {
            expandCategoriesInView();
            highlightTopMostKey();
        });
        window.addEventListener('resize', function () {
            if (rootNode.children[0]) {
                rootNode.children[0].style.height = window.innerHeight - 125 + 'px';
            }
        });
        // init the menu with a time delay
        setTimeout(function () {
            expandCategoriesInView();
            highlightTopMostKey();
        }, 1500);
    }
};

},{"../util/url":46,"./translationView":41}],27:[function(require,module,exports){
'use strict';

var _onLogout = function onLogout() {
    console.log('auth:onLogout is not handled');
},
    brain = {
    logoutButton: function logoutButton(node) {
        node.addEventListener('click', _onLogout);
    }
};

module.exports = {
    onLogout: function onLogout(fc) {
        _onLogout = fc;
    },
    add: function add(node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr](node);
        }
    }
};

},{}],28:[function(require,module,exports){
'use strict';

var repeatFcPointer,
    _onClick = function onClick(item) {
    console.warn('breadcrumb:click handler not registered', item);
};

module.exports = {
    onClick: function onClick(fc) {
        _onClick = fc;
    },
    add: function add(node, attr) {},
    /**
     *
     * @param parentDirectories [String]
     */
    updateFolders: function updateFolders(parentDirectories) {
        repeatFcPointer(parentDirectories.map(function (item) {
            return { name: item.name, onClick: function onClick() {
                    _onClick(item.id);
                } };
        }));
    },
    /**
     * for canny repeat to get
     */
    registerCannyRepeat: function registerCannyRepeat(fc) {
        repeatFcPointer = fc;
    }
};

},{}],29:[function(require,module,exports){
module.exports = "<div class=\"connectionLost\">\n  <section>\n    <i class=\"octicon octicon-plug\"></i>\n    <h2>{{item.title}}</h2>\n    <div class=\"errorCode\"><p>Error code: <strong>{{item.errorCode}}</strong><span class=\"errorMessage\" wk-bind=\"item.errorMessage\"></span></p></div>\n    <div class=\"button-section\">\n      <button class=\"reconnect\" wk-bind=\"item.reconnect\" title=\"Try to reconnect your changes will be overwritten\">reconnect</button>\n      <button class=\"close\" wk-bind=\"item.close\" title=\"You can close this view to rescure you changes manually\">close</button>\n      <button class=\"reload\" wk-bind=\"item.reload\" title=\"If you do a page reload all your unsaved changes will be lost\">reload page</button>\n    </div>\n  </section>\n  <div class=\"progressUi\"></div>\n</div>";

},{}],30:[function(require,module,exports){
'use strict';

var whisker = require('canny/mod/whisker');
var template = require('./index.html');
var TEXTS = function TEXTS(code) {
    switch (code) {
        case 'EXCEPTION':
            return 'wow... not good - please report this problem to a developer';
        case 'FATAL':
            return 'dammed... this should not happen - please consult dev of trust';
        case 'AUTH':
            return 'Session timeout please login again';
        case 'RECONNECT_FAIL':
            return 'can\'t create a connection';
        default:
            return 'whooops... server connection lost';
    }
};
/**
 *
 * @param onReload
 * @param onReconnect
 * @returns {{render: (function(string)), destroy: (function())}}
 */
module.exports = function (_ref) {
    var onReload = _ref.onReload,
        onReconnect = _ref.onReconnect,
        onClose = _ref.onClose;

    // saves the active node
    var ui = void 0;

    function _render(_ref2) {
        var errorCode = _ref2.errorCode,
            _errorMessage = _ref2.errorMessage;

        if (ui) ui.remove();
        var d = document.createElement('div');
        d.innerHTML = template;
        whisker.add(d.children[0], {
            reconnect: function reconnect(n) {
                if (errorCode === 'RECONNECT_FAIL' || errorCode === 'FATAL' || errorCode === 'AUTH' || errorCode === 'SERVER_DOWN' || errorCode === 'EXCEPTION') return false;
                n.addEventListener('click', onReconnect);
            },
            close: function close(n) {
                return n.addEventListener('click', onClose);
            },
            reload: function reload(n) {
                return n.addEventListener('click', onReload);
            },
            errorCode: errorCode,
            title: TEXTS(errorCode),
            errorMessage: function errorMessage(n) {
                if (_errorMessage) {
                    n.innerHTML = ' ' + _errorMessage;
                } else return false;
            }
        });
        document.body.appendChild(ui = d.children[0]);
    }

    return {
        /**
         * Show the module
         * @param {string} err - error code to print on the view
         */
        render: function render(err, msg) {
            return _render({ errorCode: err, errorMessage: msg });
        },
        /**
         * Remove the module from ui
         */
        destroy: function destroy() {
            ui.remove();
            ui = undefined;
        },
        /**
         * indicates that the view is busy
         */
        showProgress: function showProgress() {
            ui.classList.add('progress');
        }
    };
};

},{"./index.html":29,"canny/mod/whisker":56}],31:[function(require,module,exports){
'use strict';

var _onCreateNewProject = function onCreateNewProject() {
    console.warn('createNewProject.onCreateNewProject not set');
},
    onCreateNewDirectory = function onCreateNewDirectory() {
    console.warn('createNewProject.onCreateNewDirectory not set');
};

var projectNameInputNode, directoryNameInputNode;

function noSpaces(node) {
    node.addEventListener('keypress', function (e) {
        var key = e.keyCode || e.which;
        if (key === 32) e.returnValue = false;
        return true;
    });
    return node;
}

function isValidProjectName(projectName) {
    return projectName.length > 0 && projectName.search('\\.|,| ') === -1 ? true : false;
}

function isValidDirectoryName(directoryName) {
    // TBD more forbidden characters?
    return directoryName.length > 0 && directoryName.search('/') === -1 ? true : false;
}

module.exports = {
    add: function add(node, attribute) {
        switch (attribute) {
            case 'createNewProjectInputProject':
                projectNameInputNode = node;
                break;
            case 'newDirectoryNameInput':
                directoryNameInputNode = noSpaces(node);
                break;
            case 'createNewProjectSubmit':
                node.addEventListener('click', function () {
                    var projectName = projectNameInputNode.value;
                    if (isValidProjectName(projectName)) {
                        _onCreateNewProject(projectName);
                    } else {
                        projectNameInputNode.classList.add('error');
                    }
                });
                break;
            case 'createNewDirectorySubmit':
                node.addEventListener('click', function () {
                    var directoryName = directoryNameInputNode.value;
                    if (isValidDirectoryName(directoryName)) {
                        onCreateNewDirectory(directoryName);
                    } else {
                        directoryNameInputNode.classList.add('error');
                    }
                });
                break;
            case 'cancel':
                node.addEventListener('click', function () {
                    canny.displayManager.hide(this.dataset.view);
                });
                break;
        }
    },
    /**
     * Pass in listener for execution of creating new project.
     * @param func
     */
    onCreateNewProject: function onCreateNewProject(func) {
        _onCreateNewProject = func;
    },
    /**
     * Pass in listener for execution of creating a new directory.
     * @param func
     */
    onCreateNewDirectoy: function onCreateNewDirectoy(func) {
        onCreateNewDirectory = func;
    }
};

},{}],32:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Overlay = require('./overlay'),
    displayManager = function displayManager() {

	var mainController = canny.flowControl,
	    overlayController = canny.flowControl.createNewInstance('overlays'),
	    children = {
		overlay: {
			ids: [],
			controller: overlayController,
			add: function add(node, id) {

				var overlay = new Overlay(node, id);
				overlay.onClick(function () {
					setDisplayStateById(id, false);
				});

				this.controller.add(overlay.node, {
					'view': overlay.id
				});
				this.ids.push(overlay.id);
			}
		},
		view: {
			ids: [],
			controller: mainController,
			add: function add(node, id) {
				this.controller.add(node, {
					'view': id
				});
				this.ids.push(id);
			}
		}
	};

	function setDisplayStateById(id, show) {
		Object.keys(children).map(function (type) {
			var pool = children[type],
			    ids = pool.ids,
			    currentId;

			for (var i = 0; i < ids.length; i++) {
				currentId = ids[i];
				if (id === currentId) {
					if (show) {
						pool.controller.show(currentId);
					} else if (pool.controller.mod[id]) {
						pool.controller.mod[id].forEach(function (obj) {
							obj.hide();
						});
					}
					break;
				}
			}
		});
	}

	return {
		add: function add(node, descriptor) {
			var keys, key;
			if ((typeof descriptor === 'undefined' ? 'undefined' : _typeof(descriptor)) === 'object') {
				keys = Object.keys(descriptor);
				for (var i = 0; i < keys.length; i++) {
					key = keys[i];
					if (children.hasOwnProperty(key)) {
						children[key].add(node, descriptor[key]);
					}
				}
			} else {
				console.warn('Parameter to add child to displayManager is not valid: ' + descriptor);
			}
		},
		show: function show(id) {
			setDisplayStateById(id, true);
		},
		hide: function hide(id) {
			setDisplayStateById(id, false);
		}

	};
};

module.exports = displayManager;

},{"./overlay":37}],33:[function(require,module,exports){
'use strict';

/**
 * handles all texts
 */
var domOpts = require('dom-opts'),
    flagMap = {
    da: 'dk',
    de: 'de',
    fr: 'fr',
    nl: 'nl',
    en: 'us',
    en_GB: 'gb',
    sv: 'se',
    es: 'es'
};

function getLang(lang) {
    var flagLang = lang;
    if (flagMap.hasOwnProperty(lang)) {
        flagLang = flagMap[lang];
    }
    return flagLang;
}

module.exports = {
    getFlag: function getFlag(lang) {
        return domOpts.createElement('span', null, 'flag-icon flag-icon-' + getLang(lang));
    },
    getFlagClasses: function getFlagClasses(lang) {
        return ['flag-icon', 'flag-icon-' + getLang(lang)];
    }
};

},{"dom-opts":65}],34:[function(require,module,exports){
'use strict';

/*global ace */
/*jslint browser: true */
var events = require('../events.js');
var C = require('../CONST.js');

window.domOpts = window.domOpts || require('dom-opts');

var imageViewer = function () {
    "use strict";

    var nodeToAppend,
        init = false,
        config = {
        idPrefix: 'imageViewer_'
    },
        setupContainerCSS = function setupContainerCSS(node, css) {
        for (var prop in css) {
            node.style[prop] = css[prop];
        }
    },
        settings = {
        maxWidth: 300,
        maxHeight: 300
    },
        fc = {
        hideImageViewer: function hideImageViewer() {
            var pres = nodeToAppend.domChildTags('img');

            if (pres.length > 0) {
                // there are other open images
                pres.forEach(function (e) {
                    e.domAddClass('hidden');
                });
            }
        },
        showImage: function showImage(obj) {
            var img,
                id = config.idPrefix + obj.id,
                actualImg = document.getElementById(id);

            if (actualImg !== null) {
                actualImg.domRemoveClass('hidden');
            } else {
                img = new Image();
                img.onload = function () {
                    console.log('DONE IMAGE');
                };
                img.src = "data:image/png;base64," + obj.data;
                setupContainerCSS(img, {
                    maxWidth: '100%',
                    maxHeight: '100%'
                });
                img.setAttribute('id', id);
                img.domAppendTo(nodeToAppend);
            }
        }
    };

    events.addServerListener('sendFile', function (obj) {
        if (init) {
            fc.hideImageViewer();

            if (obj.fileType === C.FILE_MANAGER.FILE_TYPES.IMAGE) {
                fc.showImage(obj);
            }
        }
    });

    return {
        add: function add(node, attr) {
            init = true;
            nodeToAppend = node;
            nodeToAppend.setAttribute('id', 'imageViewer');

            setupContainerCSS(nodeToAppend, {
                width: settings.maxWidth + 'px',
                height: settings.maxHeight + 'px'
            });
        },
        setup: function setup(config) {
            var obj;
            for (obj in config) {
                settings[obj] = config[obj];
            }
        }
    };
}();

module.exports = imageViewer;

},{"../CONST.js":2,"../events.js":18,"dom-opts":65}],35:[function(require,module,exports){
'use strict';

function addEdit(node, fc) {
    var div = domOpts.createElement('div', null, 'inputEditManager-button edit octicon octicon-pencil');
    div.addEventListener('click', function (event) {
        node.classList.add('c-edit');
        fc(event);
    });
    div.setAttribute('title', 'edit');
    node.appendChild(div);
}
function addCancel(node, fc) {
    var div = domOpts.createElement('div', null, 'inputEditManager-button cancel octicon octicon-x');
    div.addEventListener('click', function (event) {
        node.classList.remove('c-edit');
        fc(event);
    });
    div.setAttribute('title', 'cancel');
    node.appendChild(div);
}

function addSave(node, fc) {
    var div = domOpts.createElement('div', null, 'inputEditManager-button save octicon octicon-check');
    div.addEventListener('click', function (event) {
        fc(event);
    });
    div.setAttribute('title', 'save changes');
    node.appendChild(div);
}

function addClone(node, fc) {
    var div = domOpts.createElement('div', null, 'inputEditManager-button save octicon octicon-file-symlink-file');
    div.addEventListener('click', function (event) {
        fc(event);
    });
    div.setAttribute('title', 'move key into other category');
    node.appendChild(div);
}

function addDelete(node, fc) {
    var div = domOpts.createElement('div', null, 'inputEditManager-button delete octicon octicon-trashcan');
    div.addEventListener('click', function (event) {
        fc(event);
    });
    div.setAttribute('title', 'remove this key');
    node.appendChild(div);
}

function closeEditorView(keyInputNode) {
    var editorPanelNode = keyInputNode.parentNode.querySelector('.inputEditManager.wrap');
    if (editorPanelNode) {
        editorPanelNode.classList.remove('c-edit');
    }
}

module.exports = {
    /**
     * each key input node hast
     * @param keyInputNode
     */
    closeEditView: function closeEditView(keyInputNode) {
        if (keyInputNode) {
            closeEditorView(keyInputNode);
        }
    },
    addEditorPanel: function addEditorPanel(keyNode, listeners) {
        var containerNode = domOpts.createElement('div', null, 'inputEditManager wrap');

        if (listeners.hasOwnProperty('onEdit')) {
            addEdit(containerNode, listeners.onEdit);
        }
        if (listeners.hasOwnProperty('onDelete')) {
            addDelete(containerNode, listeners.onDelete);
        }
        if (listeners.hasOwnProperty('onSave')) {
            addSave(containerNode, listeners.onSave);
        }
        if (listeners.hasOwnProperty('onClone')) {
            addClone(containerNode, listeners.onClone);
        }
        if (listeners.hasOwnProperty('onCancel')) {
            addCancel(containerNode, listeners.onCancel);
        }

        containerNode.domAppendTo(keyNode);

        return containerNode;
    },
    removePanel: function removePanel(node) {
        node.querySelector('.inputEditManager.wrap').domRemove();
    }
};

},{}],36:[function(require,module,exports){
'use strict';

var rootNode;

module.exports = {
    show: function show() {
        rootNode.classList.add('c-show');
    },
    hide: function hide() {
        rootNode.classList.remove('c-show');
    },
    add: function add(node, attr) {
        if (attr === 'button') {
            node.addEventListener('click', function () {
                if (rootNode.classList.contains('c-show')) {
                    rootNode.classList.remove('c-show');
                } else {
                    rootNode.classList.add('c-show');
                }
            });
        } else {
            rootNode = node;
        }
    }
};

},{}],37:[function(require,module,exports){
'use strict';

module.exports = function Overlay(node, id) {

	var id = id,
	    node = node,
	    clickHandler = function clickHandler() {
		console.warn('Click listener not attached for overlay with id: ' + id);
	};

	node.classList.add('displayManager-overlay');
	node.addEventListener('click', function (e) {
		if (node === e.target) {
			clickHandler();
		}
	});

	return {
		id: id,
		node: node,
		onClick: function onClick(cb) {
			clickHandler = cb;
		}
	};
};

},{}],38:[function(require,module,exports){
'use strict';

/*global */
/*jslint browser: true*/

var canny = require('canny'),
    flag = require('./flag'),
    texts = require('./texts');

/**
 * E.g.: canny-mod="flowControl" canny-var="{'view' : 'viewToShow'}"
 *
 * you can activate a initial view with a anchor in the URL e.g.: yourdomain.html#viewToShow
 * Or pass a comma separated module list for activate more module #viewToShow,otherView
 *
 * TODO made it possible to summarize views with one identifier.
 * Instead of call: gdom.flowControl.show('view1', 'view2', 'view3') call gdom.flowControl.show('view').
 */
var projectMainNavigation = function () {
    "use strict";

    var mainNode,
        selectLanguageQueue = [],
        onShowJSONQueue = [],
        onEnableEditorModeQueue = [],
        onToggleWordCountQueue = [],
        onShowJMBFQueue = [],
        onShowJMBFUploaderQueue = [],
        onShowJSONImportQueue = [],
        bundleName = window.domOpts.params.bundle,
        modViews = {
        main: function main(node) {
            mainNode = node;
        },
        menuToggleButton: function menuToggleButton(node) {
            new svgIcon(node, {
                hamburgerCross: {
                    url: '/dist/animatedSVG/svg/hamburger.svg',
                    animation: [{
                        el: 'path:nth-child(1)',
                        animProperties: {
                            from: { val: '{"path" : "m 5.0916789,20.818994 53.8166421,0"}' },
                            to: { val: '{"path" : "M 12.972944,50.936147 51.027056,12.882035"}' }
                        }
                    }, {
                        el: 'path:nth-child(2)',
                        animProperties: {
                            from: { val: '{"transform" : "s1 1", "opacity" : 1}', before: '{"transform" : "s0 0"}' },
                            to: { val: '{"opacity" : 0}' }
                        }
                    }, {
                        el: 'path:nth-child(3)',
                        animProperties: {
                            from: { val: '{"path" : "m 5.0916788,42.95698 53.8166422,0"}' },
                            to: { val: '{"path" : "M 12.972944,12.882035 51.027056,50.936147"}' }
                        }
                    }]
                }
            }, {
                easing: mina.elastic, speed: 1200, size: { w: '4em', h: '3em' }
            });
            node.addEventListener('click', function () {
                if (mainNode.classList.contains('c-open')) {
                    mainNode.classList.remove('c-open');
                } else {
                    mainNode.classList.add('c-open');
                }
            });
        },
        showResourceBundleEditor: function showResourceBundleEditor(node) {
            // reload the page because the files are not synced
            node.setAttribute('href', '#');
            node.addEventListener('click', function () {
                location.reload();
            });
        },
        showMessageBundleFormat: function showMessageBundleFormat(node) {
            node.addEventListener('click', function () {
                onShowJMBFQueue.forEach(function (fc) {
                    fc();
                });
            });
        },
        showJSONBundle: function showJSONBundle(node) {
            node.addEventListener('click', function () {
                onShowJSONQueue.forEach(function (fc) {
                    fc();
                });
            });
        },
        showJMBFUploader: function showJMBFUploader(node) {
            node.addEventListener('click', function () {
                onShowJMBFUploaderQueue.forEach(function (fc) {
                    fc();
                });
            });
        },
        showJSONImport: function showJSONImport(node) {
            node.addEventListener('click', function () {
                onShowJSONImportQueue.forEach(function (fc) {
                    fc();
                });
            });
        },
        enableEditorMode: function enableEditorMode(node) {
            node.addEventListener('click', function () {
                onEnableEditorModeQueue.forEach(function (fc) {
                    fc();
                });
            });
        },
        toggleWordCount: function toggleWordCount(node) {
            node.addEventListener('click', function () {
                onToggleWordCountQueue.forEach(function (fc) {
                    fc();
                });
            });
        },
        from: function from(node) {
            this.from.node = node;
        },
        to: function to(node) {
            this.to.node = node;
        }
    };

    /**
     *
     * @param locales []
     * @param node
     */
    function setLocale(locales, node) {
        var ul = node.querySelector('.languages'),
            li,
            languageNameNode,
            progressNode,
            flagIC;
        if (ul) {
            // remove all existing children first
            [].slice.call(ul.querySelectorAll('li')).forEach(function (elem) {
                ul.removeChild(elem);
            });
        } else {
            ul = window.domOpts.createElement('ul', null, 'navigationMenu languages');
        }
        locales.forEach(function (key) {
            var numOfTransKeys = window.domOpts.createElement('span', null, 'numOfTransKeys'),
                maxKeyNode = window.domOpts.createElement('span', null, 'maxKey');
            li = window.domOpts.createElement('li');
            languageNameNode = window.domOpts.createElement('span');
            progressNode = window.domOpts.createElement('span', null, 'progress');
            numOfTransKeys.appendChild(document.createTextNode('-'));
            numOfTransKeys.domAppendTo(progressNode);
            progressNode.appendChild(document.createTextNode('/'));
            maxKeyNode.appendChild(document.createTextNode('-'));
            maxKeyNode.domAppendTo(progressNode);

            li.classList.add('lang');
            li.classList.add(key);

            li.addEventListener('click', function () {
                var isInactive = true,
                    isActive = this.classList.contains('c-active');

                if (isActive) {
                    this.classList.toggle('c-inactive');
                    isInactive = this.classList.contains('c-inactive');
                } else {
                    // has no state
                }

                selectLanguageQueue.forEach(function (fc) {
                    fc({
                        isActive: isActive,
                        isInactive: isInactive,
                        project: bundleName,
                        language: key
                    });
                });
            });

            languageNameNode.innerHTML = texts.getLanguageNames(key);
            languageNameNode.className = 'langName';
            languageNameNode.domAppendTo(li);
            progressNode.domAppendTo(li);
            flagIC = flag.getFlag(key);
            flagIC.classList.add('icon', 'octicon', 'octicon-plus');
            flagIC.domAppendTo(li);
            li.domAppendTo(ul);
        });
        ul.domAppendTo(node);
    }

    /**
     * update all language max keys for all languages
     * @param keys
     * @param node
     */
    function updateMaxKeys(keys, node) {
        [].slice.call(node.querySelectorAll('.languages .lang')).forEach(function (langNode) {
            langNode.querySelector('.maxKey').innerHTML = keys;
        });
    }

    /**
     * update a specific language
     * @param key
     * @param lang
     * @param node
     */
    function updateNumberOfLangKeys(key, lang, node) {
        console.log('projectMainNavigation:updateNumberOfLangKeys', key, lang);
        node.querySelector('.languages .lang.' + lang + ' .numOfTransKeys').innerHTML = key;
    }

    return {
        setNumberOfTranslationMaxKeys: function setNumberOfTranslationMaxKeys(maxKeys) {
            updateMaxKeys(maxKeys, modViews.from.node);
        },
        setNumberOfTranslatedLanguageKey: function setNumberOfTranslatedLanguageKey(numberOfKeys, lang) {
            updateNumberOfLangKeys(numberOfKeys, lang, modViews.from.node);
        },
        onLanguageSelect: function onLanguageSelect(fc) {
            selectLanguageQueue.push(fc);
        },
        onShowJSON: function onShowJSON(fc) {
            onShowJSONQueue.push(fc);
        },
        onShowJMBF: function onShowJMBF(fc) {
            onShowJMBFQueue.push(fc);
        },
        onShowJMBFUploader: function onShowJMBFUploader(fc) {
            onShowJMBFUploaderQueue.push(fc);
        },
        onShowJSONImport: function onShowJSONImport(fc) {
            onShowJSONImportQueue.push(fc);
        },
        onEnableEditorMode: function onEnableEditorMode(fc) {
            onEnableEditorModeQueue.push(fc);
        },
        onToggleWordCount: function onToggleWordCount(fc) {
            onToggleWordCountQueue.push(fc);
        },
        activateLang: function activateLang(lang) {
            var node = mainNode.querySelector('li.' + lang);
            node.classList.remove('c-inactive');
            node.classList.add('c-active');
        },
        deActivateLang: function deActivateLang(lang) {
            var node = mainNode.querySelector('li.' + lang);
            node.classList.add('c-inactive');
        },
        /**
         * Apply the current project's number to the flags: activate flag where translations exist and show number of
         * translated keys.
         * @param keysTotal the total number of keys
         * @param translatedKeysPerLang the number of translated keys per language
         */
        setActivatedProjectLanguages: function setActivatedProjectLanguages(keysTotal, translatedKeysPerLang) {
            [].slice.call(mainNode.querySelectorAll('li')).forEach(function (node) {
                var progressNode = node.querySelector('.progress');
                node.classList.remove('c-active');
                if (progressNode) {
                    progressNode.children[0].innerHTML = "-";
                    progressNode.children[1].innerHTML = "-";
                }
            });

            Object.keys(translatedKeysPerLang).forEach(function (key) {
                [].slice.call(mainNode.querySelectorAll('li.' + key)).forEach(function (node) {
                    var progressNode = node.querySelector('.progress');
                    node.classList.add('c-active');
                    if (progressNode) {
                        progressNode.children[0].innerHTML = translatedKeysPerLang[key];
                        progressNode.children[1].innerHTML = keysTotal;
                    }
                });
            });
        },
        setAvailableLanguages: function setAvailableLanguages(languages) {
            setLocale(languages, modViews.from.node);
        },
        ready: function ready() {
            console.log('nav-controller ready event');
        },
        add: function add(node, attr) {
            // part of api
            if (modViews.hasOwnProperty(attr)) {
                modViews[attr](node);
            } else {
                console.log('LINK NOT IMPLEMENTED');
            }
        }
    };
}();

module.exports = projectMainNavigation;

},{"./flag":33,"./texts":40,"canny":52}],39:[function(require,module,exports){
'use strict';

var projectOverview = function () {
    'use strict';

    var componentRootNode,
        renderProjectsAndDirectoriesList,
        _onCreateProjectPressed = function onCreateProjectPressed() {
        console.warn('projectOverview.onCreateProjectPressed not set');
    },
        _onParentDirectorySelected = function onParentDirectorySelected() {
        console.warn('projectOverview.onParentDirectorySelected not set');
    },
        _onProjectSelected = function onProjectSelected() {
        console.warn('projectOverview.onProjectSelected not set');
    },
        _onDeleteProjectPressed = function onDeleteProjectPressed() {
        console.warn('projectOverview.onDeleteProjectPressed not set');
    },
        onMovedProjectPressed = function onMovedProjectPressed() {
        console.warn('projectOverview.onMovedProjectPressed not set');
    },
        _onDeleteFolderPressed = function onDeleteFolderPressed() {
        console.warn('projectOverview.onDeleteFolderPressed not set');
    },
        _onDirectorySelected = function onDirectorySelected() {
        console.warn('projectOverview.onDirectorySelected not set');
    },
        _onCreateDirectoryPressed = function onCreateDirectoryPressed() {
        console.warn('projectOverview.onCreateDirectoryPressed not set');
    },
        editModeEnabled = false;

    return {
        /**
         * Called from canny when registering components. The only component which we expect to be registered is
         * "projectOverviewContainer" (the root node of the component).
         * @param node
         * @param vars
         */
        add: function add(node, attr) {
            if (componentRootNode === undefined) {
                componentRootNode = node;
            } else {
                console.warn('projectOverview:add multiple views detected - it should be registered only ones in the DOM!');
            }
        },
        /**
         * Called from canny on documentReady event.
         */
        ready: function ready() {

            var createProjectButtonNode = componentRootNode.querySelector('.js-createProjectButton');
            if (!createProjectButtonNode) {
                console.error('No child node with class "createProjectButton found inside "projectOverviewContainer"');
            } else {
                createProjectButtonNode.addEventListener('click', function (event) {
                    _onCreateProjectPressed();
                });
            }

            var createFolderButtonNode = componentRootNode.querySelector('.js-createFolderButton');
            if (!createFolderButtonNode) {
                console.error('No child node with class "createFolderButton found inside "projectOverviewContainer"');
            } else {
                createFolderButtonNode.addEventListener('click', function (event) {
                    _onCreateDirectoryPressed();
                });
            }

            var toggleEditModeButtonNode = componentRootNode.querySelector('.js-toggleEditModeButton');
            if (!toggleEditModeButtonNode) {
                console.error('No child node with class "createFolderButton found inside "projectOverviewContainer"');
            } else {
                toggleEditModeButtonNode.addEventListener('click', function (event) {
                    editModeEnabled = !editModeEnabled;
                    componentRootNode.classList.toggle('editMode-enabled', editModeEnabled);
                    toggleEditModeButtonNode.classList.toggle('active', editModeEnabled);
                });
            }

            var selectParentDirectoryButton = componentRootNode.querySelector('.js-selectParentDirectoryButton');
            if (!selectParentDirectoryButton) {
                console.error('No child node with class "selectParentDirectoryButton" found inside "projectOverviewContainer"');
            } else {
                selectParentDirectoryButton.addEventListener('click', function (event) {
                    _onParentDirectorySelected();
                });
            }
        },
        /**
         * Inform the ui module about the new current set of directories and projects to list. This will also trigger
         * a new rendering of the projects list with the new content.
         * @param projectNames
         * @param directoryNames
         */
        setProjectsAndDirectories: function setProjectsAndDirectories(projectNames, directoryNames) {
            var projectsAndDirectories = [];

            if (!projectNames || !directoryNames) {
                return;
            } else if (!renderProjectsAndDirectoriesList) {
                console.error('renderProjectsAndDirectoriesList function has not been set, new list cannot be shown');
                return;
            }

            console.log('got projects', projectNames);
            console.log('got directories', directoryNames);

            projectNames.forEach(function (projectName) {
                projectsAndDirectories.push({
                    name: projectName,
                    dir: false,
                    openProjectListItem: function openProjectListItem() {
                        console.log('project selected:', projectName);
                        if (_onProjectSelected) {
                            _onProjectSelected(projectName);
                        }
                    },
                    deleteProjectListItem: function deleteProjectListItem() {
                        var deletionConfirmed = window.confirm('Really delete project ' + projectName + '?');
                        if (_onDeleteProjectPressed && deletionConfirmed) {
                            _onDeleteProjectPressed(projectName);
                        }
                    },
                    moveProject: function moveProject() {
                        onMovedProjectPressed(projectName);
                    }
                });
            });
            directoryNames.forEach(function (directoryName) {
                projectsAndDirectories.push({
                    name: directoryName,
                    dir: true,
                    openProjectListItem: function openProjectListItem() {
                        console.log('directory selected:', directoryName);
                        if (_onDirectorySelected) {
                            _onDirectorySelected(directoryName);
                        }
                    },
                    deleteProjectListItem: function deleteProjectListItem() {
                        var deletionConfirmed = window.confirm('Really delete folder ' + directoryName + '?');
                        if (_onDeleteFolderPressed && deletionConfirmed) {
                            _onDeleteFolderPressed(directoryName);
                        }
                    }
                });
            });

            renderProjectsAndDirectoriesList(projectsAndDirectories);
        },
        /**
         * For canny-repeat registered on the projects list, provide the function for rendering the list.
         * @param func a function which will set the list of projects and directories.
         */
        setRenderProjectsAndDirectoriesListFunction: function setRenderProjectsAndDirectoriesListFunction(func) {
            renderProjectsAndDirectoriesList = func;
        },
        deleteProjectListNode: function deleteProjectListNode(itemName) {
            var node = componentRootNode.querySelector('tr[data-listItem=' + itemName + ']');
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        },
        /**
         * Register a listener callback which will react to "to parent directory" event.
         * @param listener
         */
        onParentDirectorySelected: function onParentDirectorySelected(listener) {
            _onParentDirectorySelected = listener;
        },
        /**
         * Register a listener callback which will react to clicks on a project. The callback function should expect
         * one parameter which is the project name.
         * @param listener
         */
        onProjectSelected: function onProjectSelected(listener) {
            _onProjectSelected = listener;
        },
        /**
         * Register a listener callback which will react to clicks on a directory. The callback function should expect
         * one parameter which is the directory name.
         * @param listener
         */
        onDirectorySelected: function onDirectorySelected(listener) {
            _onDirectorySelected = listener;
        },
        onCreateProjectPressed: function onCreateProjectPressed(func) {
            _onCreateProjectPressed = func;
        },
        onDeleteProjectPressed: function onDeleteProjectPressed(func) {
            _onDeleteProjectPressed = func;
        },
        onDeleteFolderPressed: function onDeleteFolderPressed(func) {
            _onDeleteFolderPressed = func;
        },
        onCreateDirectoryPressed: function onCreateDirectoryPressed(func) {
            _onCreateDirectoryPressed = func;
        },
        onMoveDirectoryPressed: function onMoveDirectoryPressed(func) {
            onMovedProjectPressed = func;
        }
    };
}();

module.exports = projectOverview;

},{}],40:[function(require,module,exports){
'use strict';

/**
 * handles all texts
 */
var texts = function () {
    'use strict';

    var node,
        languageNames = {
        da: 'Danmark',
        de: 'Deutschland',
        fr: 'France',
        nl: 'Nederland',
        en: 'United States (Default)',
        en_GB: 'United Kingdom',
        sv: 'Sverige',
        es: 'Espanol'
    },
        texts = {
        changeTexts: function changeTexts() {},
        data: {
            projectName: '',
            projectDescription: ''
        }
    };

    return {
        getLanguageNames: function getLanguageNames(key) {
            return languageNames[key];
        },
        setTexts: function setTexts(data) {
            texts.changeTexts('msg', data);
        },
        getTexts: function getTexts(fc) {
            console.log('texts:yes text is triggered');
            texts.changeTexts = fc;
            texts.changeTexts('msg', texts.data);
        },
        add: function add(elem, attr) {
            node = elem;
        },
        ready: function ready() {
            console.log('texts ready!');
        }
    };
}();

module.exports = texts;

},{}],41:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var flag = require('./flag.js'),
    inputEditManager = require('./inputEditManager.js'),
    wordCounter = require('../util/wordCounter'),
    displayManager = require('canny').displayManager,
    conf = {
    rowPrefix: "tv_",
    inputPrefix: "keyValue_",
    inputTransPrefix: "trans_"
},
    catPrefix = 'tv_';
/**
 * Rename all DOM id attributes from old to new key
 * @param oldKey
 * @param newKey
 */
function renameDOMIds(oldKey, newKey, availableLanguages) {
    Object.keys(conf).forEach(function (prop) {
        var node;
        if (prop === 'inputTransPrefix') {
            availableLanguages.forEach(function (lang) {
                node = document.getElementById(getLanguageTextId(oldKey, lang));
                if (node) {
                    node.setAttribute('id', getLanguageTextId(newKey, lang));
                } else {
                    console.error('translationView:renameIds can not find dom node for id', getLanguageTextId(newKey, lang));
                }
            });
        } else {
            node = document.getElementById(conf[prop] + oldKey);
            if (node) {
                node.setAttribute('id', conf[prop] + newKey);
            } else {
                console.error('translationView:renameIds can not find dom node for id', conf[prop] + oldKey, 'property:', prop);
            }
        }
    });
}

function keyKeyPressListener(e) {
    var key = e.keyCode || e.which;
    if (key === 32) {
        e.returnValue = false;
    }
    return true;
}

function validateNewKey(string) {
    return string.length > 0 && string.search('\\.|,| ') === -1 ? true : false;
}

function getLanguageTextId(key, lang) {
    return conf.inputTransPrefix + [key, lang].join('_');
}

function getWordCountText(count) {
    return 'Words: ' + count;
}

/**
 * Counts the characters of the given parameter.
 *
 * Now counts:
 * punctuation, Whitespaces and Words/letters
 *
 * But does not count:
 * curly braces ( {0} ), html tags ( <br/> ) and numbers (3 eggs)
 * @param value
 */
function getCharacterCount(value) {
    while (/{.*?}/.test(value)) {
        //remove placeholders
        value = value.replace(/{.*?}/, '');
    }
    while (/<.*?>/.test(value)) {
        //remove html tags
        value = value.replace(/<.*?>/, '');
    }
    while (/\\!/.test(value)) {
        //remove leading slashes in front of !
        value = value.replace(/\\!/, '!');
    }
    return [].concat(_toConsumableArray(value)).filter(function (char) {
        return (/[\D]/.test(char)
        );
    }).length;
}

function getWordCountHeadline(category) {
    return 'Overall words in ' + category;
}

function createWordCountForLanguage(lang) {
    var countWrapper = domOpts.createElement('div', null, 'data js_' + lang),
        flagClass = flag.getFlagClasses(lang).pop(),
        wordCountLabel = domOpts.createElement('span', null, 'wordCountLabel '.concat(flagClass));
    wordCountLabel.innerHTML = getWordCountText(0);
    countWrapper.appendChild(wordCountLabel);
    return countWrapper;
}

/**
 * handle the translation overview
 * TODO refactor base.connection
 */
var translationView = function () {
    'use strict';

    /**
     * TODO remove project name - only the controller needs to know this
     *
     * @param {HTMLElement} node
     * @param {string} key - @deprecated
     * @param {string} lang
     * @param {string} text
     *
     * @class
     */

    function SaveOnLeave(node, key, lang, text) {
        var textList = [text],
            textIdx = 0;

        /**
         *
         * @param {HTMLElement} node
         * @returns {string} the key id
         */
        function getIdFromRow(node) {
            return node.parentNode.parentNode.parentNode.getAttribute('id').replace(conf.rowPrefix, '');
        }

        node.addEventListener('change', function (e) {
            console.log("Old: " + textList[textIdx]);
            var newValue = this.value;
            if (textList[textIdx] !== newValue) {
                textList.push(newValue);
                textIdx++;
            }
            console.log(textList);
            _onSaveKey && _onSaveKey(getIdFromRow(node), lang, newValue);
        });
    }

    /**
     * Clean up the attached event listeners and removes them from the node.
     * It removes the 'change' and 'keypress' event from all textArea's and input fields and
     * set it to "read only"
     *
     * @param {HTMLElement} rowNode
     */
    function removeEventListenersFromRow(rowNode) {
        [].slice.call(rowNode.querySelectorAll('textarea')).forEach(function (tarea) {
            tarea.removeEventListener('change', false);
            tarea.setAttribute('readonly', 'true');
        });

        [].slice.call(rowNode.querySelectorAll('input')).forEach(function (input) {
            input.removeEventListener('keypress', false);
            input.setAttribute('readonly', 'true');
        });
    }

    /**
     *
     * @param {HTMLElement} catNodeToInsert
     * @param {Array<HTMLElement>} catNodes
     */
    function insertCategory(catNodeToInsert, catNodes) {
        var catToAppendID = catNodeToInsert.id.toLowerCase(),
            shownCatNode,
            shownCatID;

        for (var i = 0; i < catNodes.length; i++) {
            shownCatNode = catNodes[i];
            shownCatID = catNodes[i].id.toLowerCase();
            if (catToAppendID < shownCatID) {
                rootNode.insertBefore(catNodeToInsert, shownCatNode);
                break;
            }
        }

        if (catNodes.length === 0 || catToAppendID > shownCatID) {
            rootNode.appendChild(catNodeToInsert);
        }
    }

    var rootNode,
        // main node all content are added to here
    renderTextFc,
        selectors = {
        root: "resourceBundleTable",
        debug: "debugIncomming",
        tpl: {
            tableBody: 'tableBody'
        }
    },

    // QUESTION: are these real queues?
    onQueues = {
        addNewKey: [],
        createNewProject: [],
        removeKey: [],
        renameKey: [],
        categoryClicked: [],
        removeCategory: [],
        renameCategory: []
    },
        ui = {
        css: {
            sendSuccess: 'sendSuccess',
            updateKey: 'updateKey'
        },
        /**
         *
         * @param key
         * @param inputPrefix
         */
        sendSuccess: function sendSuccess(key, inputPrefix) {
            var node1 = document.getElementById(conf.rowPrefix + key),
                node2 = document.getElementById(inputPrefix + key);
            if (node1) {
                ui.removeStateClasses(node1).classList.remove(ui.css.sendSuccess);
                setTimeout(function () {
                    ui.removeStateClasses(node1).classList.add(ui.css.sendSuccess);
                }, 100);
            }
            if (node2) {
                ui.removeStateClasses(node2).classList.remove(ui.css.sendSuccess);
                setTimeout(function () {
                    ui.removeStateClasses(node2).classList.add(ui.css.sendSuccess);
                }, 100);
            }
        },
        updateInputFields: function updateInputFields(key, inputPrefix) {
            console.error('translationView:updateInputFields', 'is this still in use????????????????????????????????????');
            debugger;
            var node = document.getElementById(inputPrefix + key);
            if (node) {
                ui.removeStateClasses(node).domAddClass(ui.css.updateKey);
            }
        },
        removeStateClasses: function removeStateClasses(node) {
            var cssState,
                classes = '';
            if (!node) {
                return;
            }
            // TODO refactor Object.keys()
            for (cssState in ui.css) {
                classes += cssState + ' ';
            }
            node.domRemoveClass(classes);
            return node;
        }
    },

    /**
     * Callback (registered from controller) to be called when changes to a key must be saved
     */
    _onSaveKey = function onSaveKey() {
        console.warn('translationView:onSaveKey not initialized');
    },
        _onCreateKey = function onCreateKey() {
        console.warn('translationView:onCreateKey not initialized');
    },
        _onCloneKey = function onCloneKey() {
        console.warn('translationView:onCloneKey not initialized');
    },
        brain = {
        cloneKeyOverlay: {
            init: function init(node) {
                this.node = node;
            },
            setData: function setData(data) {
                this.data = data;
                renderTextFc('cloneKeyOverlayText', {
                    keyName: data.keyName,
                    categoryName: data.contextName
                });
            },
            getData: function getData() {
                return this.data;
            }
        },
        cloneKeyInputCategory: {
            init: function init(node) {
                this.node = node;
            }
        },
        cloneKeyButtonSubmit: {
            init: function init(node) {
                node.addEventListener('click', function () {
                    if (brain.cloneKeyInputCategory.node.value.length === 0) {
                        brain.cloneKeyInputCategory.node.classList.add('error');
                        return;
                    }
                    var data = brain.cloneKeyOverlay.getData();
                    _onCloneKey(data.key, data.keyName, data.contextName, brain.cloneKeyInputCategory.node.value);
                });
            }
        },
        createNewProjectInputProject: {
            init: function init(node) {
                this.node = node;
            }
        },
        createNewProjectProjectDescription: {
            init: function init(node) {
                this.node = node;
            }
        },
        createNewProjectSubmit: function () {
            var node;
            return {
                init: function init(elem) {
                    node = elem;
                    node.addEventListener('click', function () {
                        var projectValue = brain.createNewProjectInputProject.node.value;

                        if (validateNewKey(projectValue)) {
                            // TODO read description field
                            onQueues.createNewProject.forEach(function (fc) {
                                fc(projectValue, {
                                    description: brain.createNewProjectProjectDescription.node.value
                                });
                            });
                            // TODO check if closed is needed?
                            displayManager.hide('createNewProjectView');
                        } else {
                            // TODO replace with classes
                            brain.createNewProjectInputProject.node.style.backgroundColor = '#ff4444';
                        }
                    });
                }
            };
        }(),
        projectShow: {
            init: function init(node) {
                node.addEventListener('click', function () {
                    displayManager.show('translationViewProjectCategoryKey');
                });
            }
        },
        projectInputCategory: {
            init: function init(node) {
                this.node = node;
            }
        },
        projectInputKey: {
            init: function init(node) {
                this.node = node;
            }
        },
        cancel: function () {
            return {
                init: function init(node) {
                    node.addEventListener('click', function () {
                        canny.displayManager.hide(this.dataset.view);
                    });
                }
            };
        }(),
        projectSubmit: function () {
            var node;
            return {
                init: function init(elem) {
                    node = elem;
                    node.addEventListener('click', function () {
                        var categoryKey = brain.projectInputCategory.node.value,
                            key = brain.projectInputKey.node.value,
                            newKey;

                        if (validateNewKey(categoryKey) && validateNewKey(key)) {
                            // TODO default language
                            newKey = categoryKey + '_' + key;
                            _onCreateKey(newKey);
                        } else {
                            // TODO replace with classes
                            brain.projectInputCategory.node.classList.add('error');
                            brain.projectInputKey.node.classList.add('error');
                        }
                    });
                }
            };
        }()
    },
        fc = {
        /**
         *
         * @returns {{rowPrefix: string, inputPrefix: string, inputTransPrefix: string}}
         */
        get config() {
            return conf;
        },
        enableEditorMode: function enableEditorMode(enable) {
            if (enable) {
                rootNode.classList.add('c-enableEditorMode');
            } else {
                rootNode.classList.remove('c-enableEditorMode');
            }
        },
        toggleWordCount: function toggleWordCount(enable) {
            rootNode.classList.toggle('c-wordCountEnabled', enable);
        },
        sendSuccess: ui.sendSuccess,
        add: function add(node, attr) {
            if (attr === 'main') {
                rootNode = node;
            } else if (brain.hasOwnProperty(attr)) {
                brain[attr].init(node);
            }
        },
        getViewKeyObject: function getViewKeyObject(obj) {
            var newKey,
                contextName = null,
                delimiter = '_';
            if (/\./.test(obj.key)) {
                delimiter = '.';
            }

            newKey = obj.key.split(delimiter);

            if (newKey.length > 1) {
                // use slice if we need the complete key in the view
                contextName = newKey.splice(0, 1)[0];
            }
            return {
                id: obj.key, // deprecated
                key: obj.key,
                contextName: contextName,
                keyName: newKey.join(delimiter),
                value: obj.value
            };
        },
        isBundleEqual: function isBundleEqual(bundle1, bundle2) {
            if (bundle1.bundle === bundle2.bundle && bundle1.locale === bundle2.locale) {
                return true;
            }
            return false;
        },
        getBundleNameFrom: function getBundleNameFrom() {

            return {
                bundle: domOpts.params.bundle || 'messages',
                locale: this.getFromParam()
            };
        },
        getFromParam: function getFromParam() {
            return domOpts.params.from || 'de';
        },
        getBundleNameTo: function getBundleNameTo() {

            return {
                bundle: domOpts.params.bundle || 'messages',
                locale: domOpts.params.to || null
            };
        },
        getBundleName: function getBundleName(locale) {
            var bundle = domOpts.params.bundle || 'messages';
            return bundle + '_' + locale;
        },
        /**
         * Render the i18n input field for keys from a single language. The row header (i.e. the actual key field) is
         * rendered, too if it does not exist yet.
         * @param bundles {key: string, data: string}
         * @param actualLanguage
         * @param availableProjectLanguages
         * @param projectName
         */
        printBundleTemplate: function printBundleTemplate(bundles, actualLanguage, availableProjectLanguages, cb) {
            var keyObj,
                projectNode,
                shownCategories = [].slice.call(rootNode.querySelectorAll('.categoryNode'));
            /**
             * Setup header and handle the category
             *
             * @param {string} contextName
             * @returns {HTMLElement}
             */
            function prepareCategoryNode(contextName, languages) {
                var categoryNode = document.getElementById(conf.rowPrefix + contextName);
                if (!categoryNode) {
                    categoryNode = document.querySelector('#templates .categoryNode').cloneNode(true);
                    categoryNode.classList.add('c-anchorMenu-parent');
                    var categoryName = contextName;
                    var categoryNodeId = categoryName;
                    categoryNode.setAttribute('id', conf.rowPrefix + categoryNodeId);
                    if (categoryName) {
                        var wrapper = categoryNode.querySelector('.headlineWrapper'),
                            h2 = categoryNode.querySelector('h2');
                        // TODO make a span for it
                        h2.appendChild(function () {
                            var span = document.createElement('span');
                            span.appendChild(document.createTextNode(categoryName));
                            span.className = 'keyName';
                            return span;
                        }());
                        h2.addEventListener('click', function (event) {
                            onQueues.categoryClicked.forEach(function (fc) {
                                fc(categoryNodeId);
                            });
                        });

                        var editPanel = inputEditManager.addEditorPanel(categoryNode, {
                            onEdit: function onEdit(event) {
                                event.stopImmediatePropagation();
                                keyInputNode.removeAttribute('disabled');
                                contextName = keyInputNode.value;
                                keyInputNode.focus();
                            },
                            onCancel: function onCancel(event) {
                                event.stopImmediatePropagation();
                                keyInputNode.setAttribute('disabled', 'true');
                                keyInputNode.value = contextName;
                            },
                            onSave: function onSave(event) {
                                event.stopImmediatePropagation();
                                onQueues.renameCategory.forEach(function (fc) {
                                    fc({
                                        oldName: contextName,
                                        newName: keyInputNode.value
                                    });
                                });
                            },
                            onDelete: function onDelete(event) {
                                event.stopImmediatePropagation();
                                var yes = window.confirm('Delete this category?\nAll keys within with will be lost.');
                                if (yes) {
                                    onQueues.removeCategory.forEach(function (fc) {
                                        fc({
                                            category: categoryName
                                        });
                                    });
                                }
                            }
                        });
                        wrapper.appendChild(editPanel);

                        var keyInputNode = domOpts.createElement('input', conf.rowPrefix + categoryName + '_input', 'categoryField');
                        keyInputNode.setAttribute('disabled', 'true');
                        keyInputNode.addEventListener('click', function (event) {
                            event.stopImmediatePropagation();
                        });
                        keyInputNode.addEventListener('keypress', keyKeyPressListener);
                        h2.appendChild(keyInputNode);
                        keyInputNode.value = categoryName;

                        // add the description functionality
                        var catDescNode = categoryNode.querySelector('.js-cat-description');
                        var span = document.createElement('span');
                        span.className = 'js-text';
                        catDescNode.appendChild(span);
                        if (catDescNode) {
                            canny.textEditor.add(catDescNode, {
                                id: categoryName,
                                placeholder: 'Add here the category description'
                            });
                            canny.translationViewImageUpload.add(categoryNode.querySelector('.js-imageUpload-editButton'), categoryName);
                        }
                        // add add key input field and button
                        var keyNameInput = categoryNode.querySelector('.addNewKeyrow input');
                        keyNameInput.setAttribute('category', categoryName);
                        keyNameInput.addEventListener('keypress', keyKeyPressListener);
                        categoryNode.querySelector('label').innerText = categoryName + "_";
                        var button = categoryNode.querySelector('button');
                        button.addEventListener('click', function () {
                            if (validateNewKey(keyNameInput.value)) {
                                var newKey = keyNameInput.getAttribute('category') + '_' + keyNameInput.value;
                                // TODO refactor this - server should add the key for all available languages - or pass default lang
                                _onCreateKey(newKey, actualLanguage);
                            } else {
                                button.style.color = '#ff0000';
                                keyNameInput.style.backgroundColor = "#ff4444";
                            }
                        });
                    }

                    // add overall word count for each language of a category
                    var overallWordsWrapper = categoryNode.querySelector('.overallWordCountWrapper'),
                        overallHeadline = overallWordsWrapper.querySelector('.overallWordsHeadline'),
                        countersWrapper = overallWordsWrapper.querySelector('.translationContainer');
                    overallHeadline.innerHTML = getWordCountHeadline(categoryName);
                    languages.forEach(function (lang) {
                        countersWrapper.appendChild(createWordCountForLanguage(lang));
                    });
                }
                return categoryNode;
            };

            bundles.forEach(function (data) {
                keyObj = fc.getViewKeyObject(data);
                // TODO which who calc the cate...
                projectNode = prepareCategoryNode(keyObj.contextName, availableProjectLanguages);
                insertCategory(projectNode, shownCategories);
                fc.addRowWithLanguages(projectNode, keyObj, actualLanguage, availableProjectLanguages);
                cb(projectNode.getAttribute('id').replace(conf.rowPrefix, ''));
                cb(keyObj.key);
            });
        },
        /**
         * Update the word count for a given category
         * @param data
         */
        updateCategoryWordCount: function updateCategoryWordCount(data) {
            var label = document.querySelector('#' + conf.rowPrefix + data.id + ' .overallWordCountWrapper .js_' + data.language + ' .wordCountLabel');
            if (label) {
                label.innerHTML = getWordCountText(data.words);
            }
        },
        /**
         * creates a key field
         *
         * @param node
         * @param data
         */
        addKeyField: function addKeyField(node, data) {
            var keyInputNode = document.getElementById(conf.inputPrefix + data.key),
                keyNode;
            if (!keyInputNode) {
                keyInputNode = domOpts.createElement('input', conf.inputPrefix + data.key, 'keyField');
                keyNode = domOpts.createElement('div', null, 'data key octicon octicon-key');
                keyInputNode.setAttribute('disabled', 'true');
                inputEditManager.addEditorPanel(keyNode, {
                    onDelete: function onDelete() {
                        var yes = window.confirm('Delete this key?\nThis key with all translations will removed.');
                        if (yes) {
                            onQueues.removeKey.forEach(function (fc) {
                                fc({
                                    key: data.key
                                });
                            });
                        }
                    },
                    onEdit: function onEdit() {
                        keyInputNode.removeAttribute('disabled');
                        // save actual key for restoring if cancel
                        data.keyName = keyInputNode.value;
                        // get the key: take id attribute and remove the value from it
                        data.key = keyInputNode.getAttribute('id').replace(conf.inputPrefix, '');
                        data.contextName = data.key.split('_')[0];
                        keyInputNode.focus();
                    },
                    onCancel: function onCancel() {
                        keyInputNode.setAttribute('disabled', 'true');
                        keyInputNode.value = data.keyName;
                    },
                    onSave: function onSave() {
                        console.log('translationView:addKeyField save new key');
                        var value = data.contextName ? data.contextName + '_' + keyInputNode.value : keyInputNode.value;
                        if (keyInputNode.value != '' && value != data.key) {
                            onQueues.renameKey.forEach(function (fc) {
                                fc({
                                    newKey: value,
                                    oldKey: data.key
                                });
                            });
                        }
                    },
                    onClone: function onClone() {
                        brain.cloneKeyOverlay.setData(data);
                        displayManager.show('translationViewCloneKey');
                    }
                });
                // register the input key listener to capture wrong character
                keyInputNode.addEventListener('keypress', keyKeyPressListener);
                keyNode.appendChild(function () {
                    var span = document.createElement('span');
                    span.appendChild(document.createTextNode(data.keyName));
                    span.className = 'keyName';
                    return span;
                }());

                keyNode.appendChild(keyInputNode);
                node.insertBefore(keyNode, node.children[0]);
                keyInputNode.value = data.keyName;
            }
        },
        /**
         * Call this to update/create a language field
         * @param node
         * @param key
         * @param value
         * @param lang
         * @param wordCount
         */
        addLanguageField: function addLanguageField(node, key, value, lang, wordCount, posIndex) {

            var textNode = document.getElementById(getLanguageTextId(key, lang)),
                dataNode,
                wordCountNode,
                charCountNode,
                textInformationNode;

            if (!textNode) {
                textNode = domOpts.createElement('textarea', getLanguageTextId(key, lang), 'textField');
                dataNode = domOpts.createElement('div', null, 'data tpl js_' + lang);
                textInformationNode = domOpts.createElement('div', null, 'textInformation');
                wordCountNode = domOpts.createElement('span', null, 'textInformation-wordCountLabel');
                charCountNode = domOpts.createElement('span', null, 'textInformation-charCountLabel');
                wordCountNode.innerHTML = getWordCountText(0);

                textInformationNode.appendChild(flag.getFlag(lang));
                textInformationNode.appendChild(wordCountNode);
                textInformationNode.appendChild(charCountNode);

                textNode.addEventListener('keyup', function () {
                    charCountNode.innerHTML = getCharacterCount(this.value);
                    wordCountNode.innerHTML = getWordCountText(wordCounter.countWordsInString(this.value));
                });

                textNode.setAttribute('type', 'text');

                new SaveOnLeave(textNode, key, lang, value);

                dataNode.appendChild(textNode);
                dataNode.appendChild(textInformationNode);

                node.insertBefore(dataNode, node.children[posIndex]);
            } else {
                wordCountNode = textNode.parentElement.querySelector('.textInformation-wordCountLabel');
                charCountNode = textNode.parentElement.querySelector('.textInformation-charCountLabel');
            }

            if (value || value === '') {
                textNode.value = value ? unicode.encode(value) : '';
                wordCountNode.innerHTML = getWordCountText(wordCounter.countWordsInString(value));
                charCountNode.innerHTML = getCharacterCount(value);
            }
        },
        /**
         * creates a row
         * @param {HTMLElement} node
         * @param {string} key
         * @returns {HTMLElement} the existing row or in case if not exists a new created row
         */
        getRow: function getRow(node, key) {
            // try to get the row
            var row = document.getElementById(conf.rowPrefix + key),
                translationContainer = row !== null ? row.querySelector('.translationContainer') : document.createElement('div');

            translationContainer.className = "translationContainer";

            // if there is a row but it is marked as removed than removed it
            if (row && row.classList.contains('c-removed')) {
                row.domRemove();
                row = undefined;
            }
            // create a row if the row is not exists
            if (!row) {
                row = domOpts.createElement('div', conf.rowPrefix + key, 'row c-row c-anchorMenu-child');
                // add the description functionality
                var catDescNode = document.createElement('div');
                var span = document.createElement('span');
                span.className = 'js-text';
                catDescNode.appendChild(span);
                catDescNode.className = 'js-row-description';
                row.appendChild(catDescNode);
                canny.textEditor.add(catDescNode, { id: key, placeholder: 'Add here the key description' });

                // add the translation area field container
                row.appendChild(translationContainer);
                node.querySelector('.keysWrapper').appendChild(row);
            }
            return row;
        },
        addRowWithLanguages: function addRowWithLanguages(node, data, actualLanguage, allProjectLanguages) {
            var row = fc.getRow(node, data.key);

            fc.addKeyField(row, data);

            allProjectLanguages.forEach(function (lang) {
                fc.addLanguageField(row.querySelector('.translationContainer'), data.key, actualLanguage === lang ? data.value : null, lang);
            });
        },
        addLanguage: function addLanguage(keys, lang, posIndex) {
            var row,
                categories = [],
                currentCategory;
            keys.forEach(function (key) {
                row = document.getElementById(conf.rowPrefix + key);
                if (row) {
                    fc.addLanguageField(row.querySelector(".translationContainer"), key, null, lang, 0, posIndex);

                    currentCategory = key.split('_')[0];
                    if (categories.indexOf(currentCategory) === -1) {
                        categories.push(currentCategory);
                    }
                } else {
                    console.log('translationView:addLanguage found key which is not available in view:', key);
                }
            });

            categories.forEach(function (category) {
                var overallWordCount = document.querySelector('#' + conf.rowPrefix + category + ' .overallWordCountWrapper .translationContainer');
                overallWordCount.appendChild(createWordCountForLanguage(lang));
            });
        },
        clearView: function clearView() {
            // just reset all for now
            // TODO do it better ;)
            [].slice.call(rootNode.children).forEach(function (child) {
                rootNode.removeChild(child);
            });
        },
        showLang: function showLang(lang) {
            // show the lang tab
            rootNode.classList.remove('c-hide_' + lang);
        },
        /**
         * remove a category
         * TODO it's not called if own user renames a category
         */
        renameCategory: function renameCategory(oldName, newName, availableProjectLanguages) {
            var categoryNode = document.getElementById(conf.rowPrefix + oldName),
                rows = categoryNode.querySelectorAll('.c-row'),
                headline = categoryNode.querySelector('h2'),
                addKeyNode = categoryNode.querySelector('.addNewKeyrow');

            categoryNode.id = conf.rowPrefix + newName;

            headline.querySelector('.keyName').childNodes[0].nodeValue = newName;

            addKeyNode.querySelector('label').innerHTML = newName + '_';
            addKeyNode.querySelector('input').setAttribute('category', newName);

            [].slice.call(rows).forEach(function (row) {
                var id = row.id.replace(conf.rowPrefix, ''),
                    splitName = id.split('_'),
                    newKeyName;

                splitName.shift();
                newKeyName = newName + '_' + splitName.join('_');
                if (id !== '') {
                    renameDOMIds(id, newKeyName, availableProjectLanguages);
                } else {
                    console.error('translationView:renameCategory should not hav an empty id', row);
                }
            });
            inputEditManager.closeEditView(headline);
            headline.querySelector('.categoryField').setAttribute('disabled', 'true');
        },
        /**
         * remove a category
         */
        removeCategory: function removeCategory(cat) {
            var row = document.getElementById(conf.rowPrefix + cat);
            if (row) {
                row.domRemove();
            }
        },
        /**
         * show a key as deleted
         * @param key
         */
        markKeyAsRemoved: function markKeyAsRemoved(key) {
            var row = document.getElementById(conf.rowPrefix + key),
                removeIc;
            if (row && !row.classList.contains('c-removed')) {
                row.classList.add('c-removed');
                removeIc = domOpts.createElement('div', null, 'remove-button octicon octicon-x');
                removeIc.addEventListener('click', function () {
                    row.domRemove();
                });
                removeIc.domAppendTo(row);
                removeEventListenersFromRow(row);
                inputEditManager.removePanel(row);
            } else {
                console.error('translationView:markkeyAsRemoved no node found for key', key, row);
            }
        },
        /**
         * remove a key
         */
        removeKey: function removeKey(key) {
            var row = document.getElementById(conf.rowPrefix + key);
            if (row) {
                row.domRemove();
            }
        },
        /**
         * rename a key
         *
         * @param oldKey
         * @param newKey
         * @param availableProjectLanguages []
         */
        renameKey: function renameKey(oldKey, newKey, availableProjectLanguages) {
            var keyInputNode = document.getElementById(conf.inputPrefix + oldKey),
                keyName;

            if (keyInputNode) {
                keyName = fc.getViewKeyObject({ key: newKey }).keyName;
                renameDOMIds(oldKey, newKey, availableProjectLanguages);
                keyInputNode.value = keyName;
                // close the edit view
                inputEditManager.closeEditView(keyInputNode);
                // disabled the input field
                keyInputNode.setAttribute('disabled', 'true');
                keyInputNode.parentNode.querySelector('.keyName').childNodes[0].nodeValue = keyName;
            }
        },
        removeImage: function removeImage(categoryName) {
            var imageBox = rootNode.querySelector('#' + conf.rowPrefix + categoryName + ' .imageUpload-imageBox');
            while (imageBox.firstChild) {
                imageBox.removeChild(imageBox.firstChild);
            }
            imageBox.classList.remove('c-show');
        },
        hideLang: function hideLang(lang) {
            rootNode.classList.add('c-hide_' + lang);
        },
        onCreateNewProject: function onCreateNewProject(cb) {
            onQueues.createNewProject.push(cb);
        },
        onCategoryClicked: function onCategoryClicked(cb) {
            onQueues.categoryClicked.push(cb);
        },
        onAddNewKey: function onAddNewKey(cb) {
            onQueues.addNewKey.push(cb);
        },
        onRenameKey: function onRenameKey(cb) {
            onQueues.renameKey.push(cb);
        },
        onRemoveKey: function onRemoveKey(cb) {
            onQueues.removeKey.push(cb);
        },
        onRemoveCategory: function onRemoveCategory(cb) {
            onQueues.removeCategory.push(cb);
        },
        onRenameCategory: function onRenameCategory(cb) {
            onQueues.renameCategory.push(cb);
        },
        /**
         * Set logic for handling saving changes to a key.
         * @param func
         */
        onSaveKey: function onSaveKey(func) {
            _onSaveKey = func;
        },
        /**
         * Set logic for handling saving changes to a key.
         * @param func
         */
        onCreateKey: function onCreateKey(func) {
            _onCreateKey = func;
        },
        onCloneKey: function onCloneKey(func) {
            _onCloneKey = func;
        },
        registerWhisker: function registerWhisker(fc) {
            renderTextFc = fc;
        }
    };
    return fc;
}();

module.exports = translationView;

},{"../util/wordCounter":47,"./flag.js":33,"./inputEditManager.js":35,"canny":52}],42:[function(require,module,exports){
'use strict';

var node;
module.exports = {
    add: function add(elem, attr) {
        node = elem;
    },
    addDescriptions: function addDescriptions(keyDescriptions) {
        Object.keys(keyDescriptions).forEach(function (key) {
            var parent = document.getElementById(key),
                child;
            if (parent) {
                child = parent.querySelector('.js-text');
                if (child) {
                    child.innerHTML = keyDescriptions[key];
                }
            }
        });
    }
};

},{}],43:[function(require,module,exports){
'use strict';

/**
 * is for the translation view to add the image upload button and show the images
 */
var rootNode,
    _onUploadButton = function onUploadButton() {
    console.warn('translationViewImageUpload::onUploadButton() not implemented.');
},
    _onDeleteButton = function onDeleteButton() {
    console.warn('translationViewImageUpload::onDeleteButton() not implemented.');
};

function uploadButton(id) {
    var node = document.createElement('div');
    node.className = 'upload-btn octicon octicon-cloud-upload';
    node.addEventListener('click', function () {
        _onUploadButton(id);
    });
    node.setAttribute('title', 'upload a image file');
    return node;
}

function editPanel(id) {
    var deleteBtn = document.createElement('div'),
        editBtn = document.createElement('div'),
        cancelBtn = document.createElement('div'),
        panelWrap = document.createElement('div');

    panelWrap.className = 'imageUpload-imageBox-editPanel';
    editBtn.className = 'edit-btn octicon octicon-pencil';
    editBtn.addEventListener('click', function () {
        panelWrap.classList.add('c-edit');
    });
    cancelBtn.className = 'cancel-btn octicon octicon-x';
    cancelBtn.addEventListener('click', function () {
        panelWrap.classList.remove('c-edit');
    });
    deleteBtn.className = 'delete-btn octicon octicon-trashcan';
    deleteBtn.addEventListener('click', function () {
        _onDeleteButton(id);
    });

    deleteBtn.setAttribute('title', 'remove image');
    cancelBtn.setAttribute('title', 'cancel');
    editBtn.setAttribute('title', 'edit');

    panelWrap.appendChild(editBtn);
    panelWrap.appendChild(cancelBtn);
    panelWrap.appendChild(deleteBtn);
    return panelWrap;
}

function getImage(file) {
    var img = new Image();
    img.src = file;
    img.addEventListener('click', function () {
        var win = window.open(file, '_blank');
        win.focus();
    });
    return img;
}

function addImageContent(id, img) {
    var node = document.createElement('div'),
        resizeAble = document.createElement('div');
    resizeAble.className = 'imageUpload-imageBox-resizeable';
    node.className = 'imageUpload-imageBox-content';
    resizeAble.appendChild(img);
    node.appendChild(resizeAble);
    node.appendChild(editPanel(id));
    return node;
}

module.exports = {
    onUploadButton: function onUploadButton(fc) {
        _onUploadButton = fc;
    },
    onDeleteButton: function onDeleteButton(fc) {
        _onDeleteButton = fc;
    },
    add: function add(node, attr) {
        node.appendChild(uploadButton(attr));
    },
    appendImage: function appendImage(id, url) {
        var dom = document.getElementById('tv_' + id),
            imgContainer;
        if (dom) {
            imgContainer = dom.querySelector('.js-imageUpload-box');
            if (imgContainer) {
                [].slice.call(imgContainer.children).forEach(function (n) {
                    n.remove();
                });
                imgContainer.classList.add('c-show');
                imgContainer.appendChild(addImageContent(id, getImage('/images' + url)));
            }
        }
    }
};

},{}],44:[function(require,module,exports){
'use strict';

/**
 * shows the uploader form to upload a image to the server
 */
var _onUpload = function onUpload() {},
    brain = {
    fileInput: {
        init: function init(node) {
            node.addEventListener('change', upload);
        }
    }
};

function upload() {
    console.log('c-upload:trigger upload');
    var file = this.files[0];
    if (file) {
        // send it direct after drop
        [].slice.call(this.files).forEach(function (file) {
            // TODO instead pass  directly a array of files - so we save POST calls
            _onUpload(file);
        });
        // cleanup value otherwise file with same name can't uploaded again
        this.value = null;
        return false;
    }
}
/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = {
    onUpload: function onUpload(fc) {
        _onUpload = fc;
    },
    add: function add(node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr].init(node);
        }
    }
};

},{}],45:[function(require,module,exports){
'use strict';

var unicode = function () {

    String.prototype.getEachChar = function (cb) {
        var newString = this;
        for (var i = 0; i < newString.length; i++) {
            newString[i] = cb(newString[i]);
        }
        return newString.toString();
    };
    var reg = new RegExp('\\\\u([0-9a-fA-F]{4})', "g");
    return {
        encode: function encode(string) {
            if (!string) {
                return '';
            }
            var newstring = string.replace(reg, function (match, submatch) {
                return String.fromCharCode(parseInt(submatch, 16));
            });
            return newstring;
        },
        decode: function decode(string) {
            return string.getEachChar(function (c) {
                for (var i = 0; i < table.length; i++) {
                    if (table[i] == c) {
                        console.log('found:' + table[i]);
                        return table[i];
                    }
                }
                return c;
            });
        }

    };
}();

module.exports = unicode;

var table = ['\xC0', '\xC1', '\xC2', '\xC3', '\xC4', '\xC5', '\xC6', '\xC7', '\xC8', '\xC9', '\xCA', '\xCB', '\xCC', '\xCD', '\xCE', '\xCF', '\xD0', '\xD1', '\xD2', '\xD3', '\xD4', '\xD5', '\xD6', '\xD8', '\xD9', '\xDA', '\xDB', '\xDC', '\xDD', '\xDE', '\xDF', '\xE0', '\xE1', '\xE2', '\xE3', '\xE4', '\xE5', '\xE6', '\xE7', '\xE8', '\xE9', '\xEA', '\xEB', '\xEC', '\xED', '\xEE', '\xEF', '\xF0', '\xF1', '\xF2', '\xF3', '\xF4', '\xF5', '\xF6', '\xF8', '\xF9', '\xFA', '\xFB', '\xFC', '\xFD', '\xFE', '\xFF'];

},{}],46:[function(require,module,exports){
'use strict';

function getAnchor() {
    var href = location.href;
    if (/#/.test(href)) {
        return '#' + location.href.replace(/.*#/, '');
    }
    return '';
}

module.exports = {
    getAnchor: getAnchor,
    hasAnchor: function hasAnchor() {
        return getAnchor() !== '';
    }
};

},{}],47:[function(require,module,exports){
'use strict';

var regExPunc = new RegExp(/([\.,\s!;?:\"]|\{(.*?)\})+/gi);

/**
 * Count amount of words in a given String
 * @param str
 * @returns Number
 */
module.exports.countWordsInString = function countWordsInString(str) {
    if (str) {
        return str.replace(regExPunc, ' ').trim().split(' ').length;
    }
    return 0;
};

},{}],48:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],49:[function(require,module,exports){

},{}],50:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":48,"buffer":50,"ieee754":67}],51:[function(require,module,exports){
/*global base.cookieHandler, canny */

(function () {
    var DEFAULT_LIFETIME_AS_DAYS = 365 * 5,
        DEFAULT_PATH = '/';

    var cookieManager = {};

    /**
     * A cookie manager for handling cookies where the cookie value is a JSON-stringified object.
     *
     * For creating a session cookie (i.e. deleted when browser closes), add a null-valued domain property to
     * cookieAttributes.
     *
     * @param cookieName
     * @param cookieAttributes: an optional object where the properties are attributes of the cookie - expireDays,
     * domain, path (if any of those is left out defaults will be used).
     * @returns {{cookieName, store: store, storeAll: storeAll, getValue: getValue, getValues: getValues}}
     * @constructor
     */
    var CookieManager = function(cookieName, cookieAttributes) {

        var lifetimeAsDays = (function() {
            if (cookieAttributes && cookieAttributes.expireDays) {
                return cookieAttributes.expireDays;
            } else if (cookieAttributes && cookieAttributes.expireDays === null) {
                return null;
            } else {
                return DEFAULT_LIFETIME_AS_DAYS;
            }
        })();
        var domain = cookieAttributes && cookieAttributes.domain ?
            cookieAttributes.domain : cookieManager.computeCookieDomain(document.location.hostname, false);
        var path = cookieAttributes && cookieAttributes.path ?
            cookieAttributes.path : DEFAULT_PATH;

        function getCookieValues(cookieName) {
            var i, currentName, currentValue, decodedValue,
                allCookies = window.document.cookie.split(";"),
                cookieValue = {};
            for (i = 0; i < allCookies.length; i++) {
                currentName = allCookies[i].substr(0, allCookies[i].indexOf("="));
                currentName = currentName.replace(/^\s+|\s+$/g, "");
                if (currentName === cookieName) {
                    currentValue = allCookies[i].substr(allCookies[i].indexOf("=") + 1);
                    try {
                      cookieValue = JSON.parse(decodeURIComponent(currentValue));
                    } catch (err) {
                      cookieValue = decodeURIComponent(currentValue);
                    }

                }
            }
            return cookieValue;
        }

        function computeNewExpiryDateString() {
            var expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + lifetimeAsDays);
            return expiryDate.toUTCString();
        }

        /**
         * Update the *full* value of the cookie, incl. writing all other cookie attributes according to
         * configuration of cookie manager.
         * @param cookieValue an object where each own property is an entry in the cookie value.
         */
        function updateCookie(cookieValue) {
            var cookieParts = [
                cookieName + '=' + encodeURIComponent(JSON.stringify(cookieValue)),
                'path=' + path,
                'domain=' + domain
            ];
            if (lifetimeAsDays) {
                cookieParts.push('expires=' + computeNewExpiryDateString());
            }

            window.document.cookie = cookieParts.join(';');
        }

        /**
         * Merge new values into existing/old values.
         * @param newCookieValues an object holding all new cookie value entries (entries may already exist
         * in existingCookieValues)
         * @param existingCookieValues an object holding all existing cookie value entries.
         * @returns {*}
         */
        function mergeNewIntoOldValues(newCookieValues, existingCookieValues) {
            Object.keys(newCookieValues).forEach(function (key) {
                existingCookieValues[key] = newCookieValues[key];
            });
            return existingCookieValues;
        }

        function updateCookieValues(cookieValues) {
            var oldCookieValue = getCookieValues(cookieName);
            if (Object.keys(oldCookieValue).length === 0) {
                updateCookie(cookieValues);
            } else {
                updateCookie(mergeNewIntoOldValues(cookieValues, oldCookieValue));
            }
        }

        function isValidCookieValueEntries(entries) {
            return typeof entries === 'object' && Object.prototype.toString.call( entries ) !== '[object Array]';
        }

        return {
            get cookieName() { return cookieName; },
            /**
             *
             * @param key a key (String)
             * @param value a value, can be any type of object (incl. nested). value can be a JSON string but will
             *     *not*  be parsed.
             */
            store : function(key, value) {
                var newValue = {};
                newValue[key] = value;
                updateCookieValues(newValue);
            },
            /**
             *
             * @param entries an object where all own properties will be added to the cookie value (rules for values
             * from store function apply here as well). Existing entries will be overwritten. No object encoded as
             * Json string accepted, no Arrays either.
             */
            storeAll : function(entries) {
                if (!isValidCookieValueEntries(entries)) {
                    throw new TypeError('cookieManager.storeAll accepts only objects (incl. no arrays), parameter was "'
                        + entries + '"');
                }
                updateCookieValues(entries);
            },
            /**
             * Get the value of a single entry from the cookie.
             * @param key
             * @returns {*}
             */
            getValue : function(key) {
                return getCookieValues(cookieName)[key];
            },
            /**
             * Get all entries (as an object) from the cookie.
             * @returns {*}
             */
            getValues : function() {
                return getCookieValues(cookieName);
            }
            // if needed, add remove(key) and removeAll(keys) functions to the api
        };
    };

    /**
     * Factory function which produces a cookie manager for the given cookie name and config.
     * @param cookieName
     * @param cookieAttributes: see constructor documentation
     * @returns {CookieManager}
     */
    cookieManager.forCookie = function(cookieName, cookieAttributes) {
        return new CookieManager(cookieName, cookieAttributes);
    };

    /**
     *
     * @param cookieName the name of the cookie
     * @param cookieAttributes attributes of the cookie (but note that expires attributes cannot be overwritten, it will
     * be added to that object)
     * @returns {CookieManager}
     */
    cookieManager.forSessionCookie = function(cookieName, cookieAttributes) {
        cookieAttributes = cookieAttributes || {};
        cookieAttributes['expireDays'] = null;
        return new CookieManager(cookieName, cookieAttributes);
    };

    /**
     * Convenience factory function which produces a cookie manager for the standard GD cookie.
     * @param cookieAttributes: see constructor documentation
     * @returns {CookieManager}
     */
    cookieManager.forGDStandardCookie = function () {
        // TODO what is the name of the standard cookie?
        return new CookieManager('GD');
    };

    /**
     * Extracts the cookie domain from the given hostname.
     * @param hostname
     * @param includeSubDomains if true all subdomains will be omitted
     */
    cookieManager.computeCookieDomain = function(hostname, includeSubDomains) {
        if (hostname.indexOf('gameduell') !== -1 && !includeSubDomains) {
            var hostnameParts = hostname.split('.');
            for (var i = 0; i < hostnameParts.length; i++) {
                if (hostnameParts[i] === "gameduell") {
                    // some infos about the leading dot:
                    // http://stackoverflow.com/questions/9618217/what-does-the-dot-prefix-in-the-cookie-domain-mean
                    // tl;dr: an obsolete RFC defined that a domain with a leading dot would mean "allow for
                    // subdomains, too" IE8/9 are still affected. Others should just disregard the dot (as per newer
                    // RFC)
                    return '.' + hostnameParts.splice(i).join('.');
                }
            }
        }

        return hostname;
    };

    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) {
        module.exports = cookieManager;
    } else {
        canny.add('cookieManager', cookieManager);
    }

}());

},{}],52:[function(require,module,exports){
/*global */
/*jslint browser: true*/
/**
 *
 * E.g.:
 *  canny-mod="moduleObj" canny-var="{'propertyKey':'value'}"
 *  canny-mod="moduleString" canny-var="button"
 *
 * Instead of canny-var you can use the module name to avoid conflicts like:
 * E.g.: canny-mod="mod1 mod2" canny-mod1={'foo':'123456', 'bar':'654321'} canny-mod2="mod2Property"
 *
 * ---------------------------------------------------------------------------- eightyfour
 */
(function (global) {
    "use strict";
    var canny = (function () {
        var readyQueue = [],
            readyQueueInit = false,
            moduleQueue = []; // save modules to call the ready method once

        /**
         * Find the single quotes and replace them with double quotes except string which
         * are part of the property string.
         *
         * @param string
         * @returns {string}
         */
        function escapeStringForJSON(string) {
            var s = string
                .replace(/\{\s*\'/g,'{"').replace(/\'\s*\}/g,'"}')
                .replace(/:\s*\'/g,':"').replace(/\'\s*:/g,'":')
                .replace(/,\s*\'/g,',"').replace(/\'\s*,/g,'",')
                .replace(/\[\s*\'/g,'["').replace(/\'\s*\]/g,'"]');
            return s;
        }

        function escapeStringForJSONArray(string) {
            var s = string
                .replace(/,\s*\'/g,',"').replace(/\'\s*,/g,'",')
                .replace(/\[\s*\'/g,'["').replace(/\'\s*\]/g,'"]');
            return s;
        }

        function callMethodQueue(queue) {
            (function reduce() {
                var fc = queue.pop();
                if (fc) {
                    fc();
                    reduce();
                } else {
                    queue = [];
                }
            }());
        }

        function parseNode(node, name, cb) {
            var that = this, gdModuleChildren = [].slice.call(node.querySelectorAll('[' + name + '-mod]')), prepareReadyQueue = {};

            gdModuleChildren.forEach(function (node) {
                var attribute = node.getAttribute(name + '-mod'), attr, viewPart, attributes, cannyVar;

                attributes = attribute.split(' ');

                attributes.forEach(function (moduleName) {
                    if (that[moduleName]) {
                        if (node.getAttribute(name + '-mod')) {
                            if (node.getAttribute(name + '-' + moduleName)) {
                                cannyVar = node.getAttribute(name + '-' + moduleName);
                            } else {
                                cannyVar = node.getAttribute(name + '-var');
                            }
                            if (cannyVar) {
                                // simple JSON test
                                if (/\{\s*\'|\".*:.*\}/.test(cannyVar)) {
                                    attr = escapeStringForJSON(cannyVar);
                                    // could be a JSON
                                    try {
                                        viewPart = JSON.parse(attr);
                                    } catch (ex) {
                                        console.error("canny can't parse passed JSON for module: " + moduleName, node);
                                    }
                                } else if (/\[\s*\'|\".*\'|\"\]/.test(cannyVar)) {
                                    attr = escapeStringForJSONArray(cannyVar);
                                    try {
                                        viewPart = JSON.parse(attr);
                                    } catch (ex) {
                                        console.error("canny can't parse passed JSON for module: " + moduleName, node);
                                    }
                                } else {
                                    viewPart = cannyVar;
                                }
                            }
                        }
                        // has module a ready function than save it for calling
                        if (that[moduleName].hasOwnProperty('ready')) {
                            // TODO or call it immediately?
                            prepareReadyQueue[moduleName] = that[moduleName].ready;
                        }
                        if (that.hasOwnProperty(moduleName)) {
                            that[moduleName].add(node, viewPart);
                        }
                    } else {
                        console.warn('canny parse: module with name ´' + moduleName + '´ is not registered');
                    }
                });
            });
            // add ready callback to moduleQueue
            Object.keys(prepareReadyQueue).forEach(function (name) {
                moduleQueue.push(prepareReadyQueue[name]);
            });
            cb && cb();
        }

        document.addEventListener('DOMContentLoaded', function cannyDomLoad() {
            document.removeEventListener('DOMContentLoaded', cannyDomLoad);

            parseNode.apply(canny, [document, 'canny']);

            callMethodQueue(moduleQueue);
            // call registered ready functions
            readyQueueInit = true;
            callMethodQueue(readyQueue);
        }, false);

        return {
            add : function (name, module) {
                var moduleApi = module;
                if (!this.hasOwnProperty(name)) {
                    if (typeof module === 'function') {
                        moduleApi = module(this); // initialize the module with the actual canny instance
                    }
                    this[name] = moduleApi;
                } else {
                    console.error('canny: Try to register module with name ' + name + ' twice');
                }
            },
            ready : function (fc) {
                if (!readyQueueInit) {
                    readyQueue.push(fc);
                } else {
                    fc();
                }
            },
            cannyParse : function (node, name, cb) {
                // TODO needs a callback
                if (typeof name === 'function') {
                    cb = name;
                    name = "canny";
                }
                parseNode.apply(this || canny, [node, name || 'canny', function () {
                    callMethodQueue(moduleQueue);
                    cb && cb();
                }]);
            }
        };
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) { module.exports = canny; } else {global.canny = canny; }
}(this));
},{}],53:[function(require,module,exports){
/*global canny */
/*jslint browser: true*/

/**
 * Required: 'canny' in global scope
 *
 * E.g.:
 * canny.async.load(URL, function (src) {
 *     node.innerHTML = src;
 *     // trigger canny parse to register canny on our new modules
 *     canny.cannyParse(node, function () {
 *         console.log('CANNY PARSE DONE');
 *     });
 * });
 *
 * Alternative you can just use loadHTML (scripts will automatically added and parsed by canny):
 * canny.async.loadHTML(node, {url : URL}, function () {
 *     console.log('kodos_load READY');
 * });
 *
 * Or directly as canny module:
 * <div canny-mod="async" canny-var="{'url':'/you/HTML/file.html'}"></div>
 *
 * TODO solve dependency problem to canny.
 *
 */
(function () {
    'use strict';
    var async = (function () {
        var filesToLoad = [],
            pushLoadCBs = [],
            ready = false;

        /**
         *
         * @param script
         * @param mediaURL
         * @param cb
         */
        function appendScript(script, mediaURL, cb) {
            var node = document.createElement('script'),
                src = script.getAttribute('src');
            // handle mediaURL and all relative script are loaded from the media URL string
            if (mediaURL && src[0] !== '/') {
                if (mediaURL[mediaURL.length - 1] !== '/') {
                    mediaURL += '/';
                }
                src = mediaURL + src;
            }
            node.type = "text/javascript";
            node.async = true;
            node.setAttribute('src', src);
            node.addEventListener('load', cb, false);
            node.addEventListener('error', cb, true);
            document.head.appendChild(node);
        }

        /**
         *
         * @param scripts
         * @param mediaURL
         * @param cb
         */
        function appendScriptsToHead(scripts, mediaURL, cb) {
            var script, i, includesScripts = false,
                scriptCounter = (function () {
                    var count = 0;
                    return {
                        up : function () {count++; },
                        ready : function () {
                            count--;
                            if (count <= 0) {
                                cb();
                            }
                        }
                    };
                }());

            for (i = 0; i < scripts.length; i++) {
                script = scripts[i];
                if (script.getAttribute('src')) {
                    includesScripts = true;
                    scriptCounter.up();
                    appendScript(script, mediaURL, scriptCounter.ready);
                } else {
                    console.warn('async: found inline script tag!!!');
                }
            }

            if (scripts.length === 0 || includesScripts === false) {
                cb();
            }

        }

        /**
         * Parse the complete given DOM and prefix all relative href URL's with the given URL
         * All URL's are handled as relative if there starts not with a / or http:// or https://
         * TODO add support for URL's with a ./ or ../ and so on
         *
         * @param node parent element
         * @param mediaURL mediaPath to another server
         */
        function handleLinks(node, mediaURL) {
            Array.prototype.slice.call(node.querySelectorAll('link')).forEach(function (link) {
                var href = link.getAttribute('href');
                if (link.getAttribute('type') === 'text/css' && 
                        href !== undefined && 
                        href[0] !== '/' &&
                        !/^http:\/\/.*/.test(href) &&
                        !/^https:\/\/.*/.test(href)) {
                    if (mediaURL[mediaURL.length - 1] !== '/') {
                        mediaURL += '/';
                    }
                    href = mediaURL + href;
                    link.setAttribute('href', href);
                }
            })
        }

        /**
         *
         * @param node
         * @param attr {{url:string, mediaURL: string}}
         * @param cb
         */
        function loadHTML(node, attr, cb) {
            var template = document.createElement('template'),
                div = ('content' in template ? template : document.implementation.createHTMLDocument('main').body),
                body,
                scripts,
                // only parse if html and scripts are loaded (scripts has callbacks because there are needs to loaded asynchronous)
                handleCannyParse = (function (cb) {
                    var waitForScripts = true,
                        waitForHTML = true,
                        triggger = function () {
                            if (!waitForScripts && !waitForHTML) {
                                canny.cannyParse(node, cb); // init only canny own modules
                            }
                        };
                    return {
                        scriptReady : function () {
                            waitForScripts = false;
                            triggger();
                        },
                        htmlReady : function () {
                            waitForHTML = false;
                            triggger();
                        }
                    };
                }(function () {
                    cb(attr);
                }));

            load(attr.url, function (src) {
                var childs;
                if (src) {
                    div.innerHTML = src;
                    // if it is a template we need the content
                    body = 'content' in div ? div.content : div;
                    scripts = body.querySelectorAll('script');
                    childs = [].slice.call(body.childNodes);
                    appendScriptsToHead(scripts, attr.mediaURL, handleCannyParse.scriptReady);

                    if (attr.mediaURL) {
                        handleLinks(body, attr.mediaURL);
                    }
                    childs.forEach(function (child) {
                        if (!(child.tagName === 'SCRIPT' && child.getAttribute('src'))) {
                            node.appendChild(child);
                        }
                    });
                    handleCannyParse.htmlReady();
                } else {
                    console.warn('async: Loading async HTML failed');
                }
            });
        }
        /**
         * simple wrapper to load HTML files with GET
         * @param path
         * @param cb
         */
        function load(path, cb) {
            doAjax({
                method: 'GET',
                path: path,
                onSuccess: function (response) {
                    cb(response.responseText);
                }
            });
        }
        /**
         *
         * @param params {{
         *   noCache:boolean,
         *   method:string|POST(default),
         *   data:object|string,
         *   path:string,
         *   async:boolean|true(default),
         *   onRequest:function (will be called with the xmlHTTPRequest object quite close before the send method is called),
         *   onFailure:function,
         *   onSuccess:function,
         *   contentType:string|Content-Type(default),
         *   mimeType:string|text plain(default)
         * }}
         */
         function doAjax(params) {
            var call = new XMLHttpRequest();
            var url = params.path;
            if (params.method === 'GET' && typeof params.data === 'object') {
                for (var attr in params.data) {
                    url = url + ((/\?/).test(url) ? "&" : "?") + attr + "=" + params.data[attr];
                }
            }
            if (params.noCache) {
                url = url + ((/\?/).test(url) ? "&" : "?") + "ts=" + (new Date()).getTime();
            }
            params.method = params.method || 'POST';
            call.open(params.method, url, params.async !== false);

            if (params.onSuccess) {
                call.addEventListener("load", function (s) {
                    params.onSuccess(s.target);
                });
            }

            if (params.onFailure) {
                call.addEventListener("error", function (s) {
                    params.onFailure(s.target);
                });
            }

            call.setRequestHeader(params.contentType || "Content-Type", params.mimeType || "text/plain");

            // allow the caller to do some extra stuff on the request object
            if (params.onRequest && typeof params.onRequest === 'function') {
                params.onRequest(call);
            }

            if (params.method === 'POST') {
                call.send(params.data);
            } else {
                call.send(null);
            }
        }

        return {
            /**
             * add a callback. So you will be notified when files are loaded asynchronous.
             * You will be called only once except your return true then async will keep
             * your callback in the notifier list and you will be informed for each async request.
             *
             * The async module will call each callback with the actual attr. So you have the control
             * how often you will be notified.
             *
             * Might be changed in the future version of async:
             * Currently this is only executed for canny modules which are loaded from the DOM directly.
             *
             * @param fc
             */
            pushLoadCB : function (fc) {
                pushLoadCBs.push(fc);
            },
            /**
             * Do a simple ajax call.
             *
             * @param params {{
             *   noCache:boolean,
             *   method:string|POST(default),
             *   data:object,string,
             *   async:boolean|true(default),
             *   path:string,
             *   onRequest:function (will be called with the xmlHTTPRequest object quite close before the send method is called),
             *   onFailure:function,
             *   onSuccess:function,
             *   contentType:string|Content-Type(default),
             *   mimeType:string|text plain(default)
             * }}
             */
            doAjax: doAjax,
            /**
             *
             * @param node
             * @param attr {{
             *  url:string,
             *  mediaURL:string
             * }}
             * @param cb
             */
            loadHTML : loadHTML,
            /**
             * Deprecated: use loadHTML instead
             * @param path
             * @param cb
             */
            load: function () {
                console.warn('async:load function load is deprecated. Use loadHTML instead');
                load.apply(null, arguments);
            },
            /**
             * canny's add method
             *
             * @param node
             * @param attr
             */
            add: function (node, attr) {    // part of api
                // TODO implement logic for loading it directly from html
                if (attr.hasOwnProperty('url')) {
                    if (!ready) {
                        filesToLoad.push({
                            node: node,
                            attr: attr
                        });
                    } else {
                        loadHTML(node, attr);
                    }
                }
            },
            ready: function () {
                var obj, cbCount = filesToLoad.length;
                while (filesToLoad.length > 0) {
                    obj = filesToLoad.splice(0, 1)[0];
                    loadHTML(obj.node, obj.attr, function (attr) {
                        var keepPushCB = [], tmpCb;
                        cbCount--;
                        while (pushLoadCBs.length > 0) {
                            tmpCb = pushLoadCBs.splice(0, 1)[0];
                            if (tmpCb(attr) === true) {
                                keepPushCB.push(tmpCb);
                            }
                        }
                        pushLoadCBs = keepPushCB;
                    });
                }
            }
        };
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) {
        module.exports = async;
    } else {
        canny.add('async', async);
    }

}());
},{}],54:[function(require,module,exports){
/*global canny */
/*jslint browser: true*/

/**
 * E.g.: canny-mod="flowControl" canny-var="{'view' : 'viewName'}"
 *
 * you can activate a initial view with a anchor in the URL e.g.: yourdomain.html#viewToShow
 * Or pass a comma separated module list for activate more module #viewToShow,otherView.
 *
 * TODO made it possible to summarize views with one identifier.
 * Instead of call: canny.flowControl.show('view1', 'view2', 'view3') call canny.flowControl.show('view').
 *
 * TODO add a hide method that just hide the specific element.
 *
 * TODO handle the fade in and out via CSS classes - and use transitions for it
 */
(function () {
    "use strict";

    /**
     * wraps transitionend event vendor implementation
     */
    function onTransitionEndOnce(node, cb) {
        var event = (function () {
                if (node.style.webkitTransition !== undefined) {
                    return 'webkitTransitionEnd';
                } else if (node.style.transition !== undefined) {
                    return 'transitionend';
                }
            }()),
            listener = function(e) {
                e.target.removeEventListener(e.type, listener);
                cb(e);
            };
        if (event) {
            node.addEventListener(event, listener, false);
        } else {
            cb();
        }
    }

    var flowControlInstance = function (fcInstanceName) {
            var instanceName = fcInstanceName,
                // flag to save if the initial queue is already initialized or not
                showInitialViewComplete = false,
                onShowInitialViewComplete = [],
                modViews = {}, // saves module views
                getViewAnchor = function () {
                    var hash = location.hash || null,
                        rx = new RegExp('[^a-zA-Z-_,]', 'g'),
                        hashSub;

                    if (hash) {
                        hashSub = hash.substr(1);
                        if (hashSub.search(rx) > -1) {
                            hashSub = hashSub.substring(0, hashSub.search(rx));
                        }
                        return hashSub.split(',');
                    }

                    return hash;
                },
                getAllModuleChildrens = function (cNode) {
                    // TODO test selector if we have more than one module in canny-mod
                    var children = cNode.querySelectorAll('[canny-mod*=' + instanceName + ']'),
                        fc_childNodes = {};
//                            if (cNode.hasChildNodes()) {
//                                [].slice.call(cNode.children).forEach(findChildren);
//                            }
                    [].slice.call(children).forEach(function (mod) {
                        var attrValue, view;
                        // TODO read attributes should be a part of canny functionality
                        attrValue = mod.getAttribute('canny-var').split("\'").join('\"');
                        if (/:/.test(attrValue)) {
                            // could be a JSON
                            view = JSON.parse(attrValue).view;
                        } else {
                            view = attrValue;
                        }
                        fc_childNodes[view] = mod;
                    });
                    return fc_childNodes;
                },
                /**
                 * Each flowControl node will end up in a flowControlModule.
                 *
                 * @param node
                 * @param attr
                 * @returns {{hasChildrenWithName: hasChildrenWithName, getViewName: getViewName, show: show, hide: hide, fadeOut: fadeOut, getNode: getNode, fadeIn: fadeIn}}
                 */
                flowControlModule = function (node, attr) {
                    var flowControlChildNodes = {},
                        async = false,
                        parentViews = fc.getParentNode(attr.view);
                    // saves all children in a object
                    flowControlChildNodes = getAllModuleChildrens(node);
//                    console.log('flowControlChildNodes:', flowControlChildNodes);
                    return {
                        hasChildrenWithName : function (viewName) {
                            return flowControlChildNodes.hasOwnProperty(viewName);
                        },
                        getViewName : function () {
                            return attr.view;
                        },
                        display : function () {
                            // don't call parents
                            // don't fade in
                            node.style.display = '';
                        },
                        show : function (cb) {
                            if (parentViews) {
                                parentViews.forEach(function (fc_module) {
//                                console.log('parentViews', fc_module.getViewName());
                                    fc_module.display();
                                });
                            }
                            if (!async && attr.hasOwnProperty('async')) {
                                canny.async.loadHTML(node, {url : attr.async}, function () {
                                    if (attr.whisker) {
                                        if (canny.whisker !== undefined) {
                                            canny.whisker.add(node, attr.whisker);
                                        } else {
                                            console.error("flowControl:try execute whisker but no whisker module is registered on canny.")
                                        }
                                    }
                                    node.style.display = '';
                                    cb();
                                });
                                async = true;
                            } else {
                                node.style.display = '';
                                cb && cb();
                            }
                        },
                        hide : function () {
                            node.style.display = 'none';
                        },
                        fadeOut : function (cb) {
                            fc.fadeOut(node, cb || function () {});
                        },
                        getNode : function () {
                            return node;
                        },
                        fadeIn : function (cb) {
                            if (parentViews) {
                                parentViews.forEach(function (fc_module) {
//                                console.log('parentViews', fc_module.getViewName());
                                    fc_module.display();
                                });
                            }
                            if (!async && attr.hasOwnProperty('async')) {
                                canny.async.loadHTML(node, {url : attr.async}, function () {
                                    if (attr.whisker) {
                                        if (canny.whisker !== undefined) {
                                            canny.whisker.add(node, attr.whisker);
                                        } else {
                                            console.error("flowControl:try execute whisker but no whisker module is registered on canny.");
                                        }
                                    }
                                    fc.fadeIn(node,  cb || function () {});
                                });
                                async = true;
                            } else {
                                fc.fadeIn(node,  cb || function () {});
                            }
                        }
                    };

                },
                showInitialView = getViewAnchor(),
                fc = {
                    // get all parent modules from the given viewName
                    getParentNode : function (viewName) {
                        var queue = Object.keys(modViews), l, i, parents = [];
                        l = queue.length;
                        for (i = 0; i < l; i++) {
                            // TODO
                            if (viewName !== queue[i] && modViews[queue[i]][0].hasChildrenWithName(viewName)) {
                                parents.push(modViews[queue[i]][0]);
                            }
                        }
                        return parents.length === 0 ? null : parents;
                    },
                    // passes a view list and complete the list with all parent node names
                    addParents : function (views) {
                        var extViews = views, i, l, pNode,
                            pushExtViews = function (name) {
                                if (extViews.indexOf(name) === -1) {
                                    extViews.push(name);
                                }
                            },
                            addParentView = function (viewName) {
                                // TODO call ends always with null - viewName is top parent
                                var pViewName = fc.getParentNode(viewName);
//                            console.log('viewName: ' + viewName, 'pViewName ' + pViewName );
                                if (pViewName) {
                                    pViewName.forEach(function (fc_module) {
                                        // TODO while has parent add it to the extViews
                                        pushExtViews(fc_module.getViewName());
                                        addParentView(fc_module.getViewName());
                                    });
                                }
                            };
                        l = views.length;
                        for (i = 0; i < l; i++) {
                            pNode = fc.getParentNode(views[i]);
                            if (pNode) {
                                pNode.forEach(function (fc_module) {
                                    pushExtViews(fc_module.getViewName());
                                    // so far we have parents do it recursive
                                    // TODO not needed each parent will do it by own -
                                    addParentView(fc_module.getViewName());
                                });
                            }
                        }
                        return extViews;
                    },
                    fadeOut : function (node, cb) {

                        if(node.style.display === 'none') {
                            cb();
                        } else {
                            node.classList.add('c-flowControl');
                            node.classList.add('fade-out');

                            setTimeout(function () {
                                node.style.display = 'none';
                                node.classList.remove('c-flowControl');
                                node.classList.remove('fade-out');
                                cb();
                            }, 300);
                        }

                    },
                    fadeIn : function (node, cb) {
                        // TODO: fade in does not work properly
                        node.style.display = '';
                        node.classList.add('c-flowControl');
                        node.classList.add('fade-in');

                        setTimeout(function() {
                            node.classList.remove('c-flowControl');
                            node.classList.remove('fade-in');
                            cb();

                            // trigger reflow to fix the black boxes issue FTTWO-1249
                            // TODO: check if this can be avoided or
                            var box = document.querySelector('.t-centerBox-content');
                            if (box) {
                                box.style.opacity = 0.99;
                                setTimeout(function() {
                                    box.style.opacity = 1;
                                }, 50);
                            }
                        }, 300);
                    }
                },
                ext = {
                    /**
                     *
                     * @param node
                     * @param innerNode
                     * @returns {{remove: remove}}
                     */
                    progress : function (node, innerNode) {
                        var newNode = document.createElement('div'), centerNode = document.createElement('div'), txtNode;
                        node.style.position = 'relative';
                        newNode.style.opacity = '0.6';
                        newNode.style.backgroundColor = '#666';
                        newNode.style.position = 'absolute';
                        newNode.style.top = 0;
                        newNode.style.left = 0;
                        newNode.style.width = node.offsetWidth + 'px';
                        newNode.style.height = node.offsetHeight + 'px';
                        newNode.style.borderRadius = window.getComputedStyle(node, null).borderRadius;

                        centerNode.style.position = 'absolute';
                        centerNode.style.top = (node.offsetHeight / 2) - 30 + 'px';
                        centerNode.style.width = node.offsetWidth + 'px';
                        centerNode.style.textAlign = 'center';

                        if (innerNode) {
                            centerNode.appendChild(innerNode);
                        }
                        node.appendChild(newNode);
                        node.appendChild(centerNode);
                        return {
                            remove : function (delay, cb) {
                                setTimeout(function () {
                                    node.removeChild(newNode);
                                    node.removeChild(centerNode);
                                    cb && cb();
                                }, delay || 0);
                            },
                            fadeOut : function (delay, cb) {
                                setTimeout(function () {
                                    fc.fadeOut(newNode, function () {
                                        node.removeChild(newNode);
                                        node.removeChild(centerNode);
                                        cb && cb();
                                    });
                                }, delay || 0);
                            }
                        };
                    }
                },
                /**
                 *
                 * @type {{mod: {}, createNewInstance: createNewInstance, ready: ready, add: add, show: show, fadeIn: fadeIn, showImmediately: showImmediately, overlay: overlay}}
                 */
                api = {
                    mod : modViews, // part of api
                    /**
                     * this method could be used to create new instances of flowControl (only needed if you
                     * load this script directly without require)
                     * @param name (unique module name)
                     **/
                    createNewInstance : function (name) {
                        return flowControl(name);
                    },
                    ready : function () {
                        var modNames = Object.keys(modViews),
                            callInitialViewCompleteQueue = true,
                            l = modNames.length,
                            i;
                        if (showInitialView && l > 0) {
                            // check if showInitialView contains a registered module
                            for (i = 0; i < l; i++) {
                                // check for existing name in showInitialView
                                if (showInitialView.indexOf(modNames[i]) !== -1) {
                                    showInitialView.push(function () {
                                        onShowInitialViewComplete.forEach(function(fc) {
                                            showInitialViewComplete = true;
                                            fc();
                                        });
                                    });
                                    callInitialViewCompleteQueue = false;
                                    api.showImmediately.apply(null, showInitialView);
                                    break;
                                }
                            }
                        }

                        if (callInitialViewCompleteQueue) {
                            onShowInitialViewComplete.forEach(function(fc) {
                                showInitialViewComplete = true;
                                fc();
                            });
                        }
                    },
                    /**
                     * Calls the given function after loading all initial views.
                     *
                     * @param fc
                     */
                    onShowInitialViewComplete : function(fc) {
                        // make sure that the passed function will be called also after initialisation
                        if (!showInitialViewComplete) {
                            onShowInitialViewComplete.push(fc);
                        } else {
                            fc();
                        }
                    },
                    /**
                     *
                     * @param node
                     * @param attr {{view:(identifier),}}
                     */
                    add : function (node, attr) {    // part of api
                        if (!modViews[attr.view]) {
                            modViews[attr.view] = [];
                        }
                        modViews[attr.view].push(flowControlModule(node, attr));
                    },
                    /**
                     * @deprecated will handle showImmediately in near future
                     */
                    show : function () {
                        api.fadeIn.apply(this, arguments);
                    },
                    /**
                     * @param name (arguments list of views to show)
                     */
                    fadeIn : function (name) {
                        var showMods = [].slice.call(arguments),
                            queue = Object.keys(modViews),
                            queueCount = 0,// = queue.length,
                            fadeIn = function () {
                                showMods.forEach(function (module) {
                                    if (modViews.hasOwnProperty(module)) {
                                        modViews[module].forEach(function (obj) {
                                            obj.fadeIn(function () {
                                                // TODO remove
//                                                console.log('FADE IN DONE');
                                                // TODO count callbacks and handle it ?
                                            });
                                        });
                                    }
                                });
                                // if last param is function than handle it as callback
                                if (typeof showMods[showMods.length - 1] === 'function') {
                                    showMods[showMods.length - 1]();
                                }
                            };
                        showMods = fc.addParents(showMods);
                        queue.forEach(function (view) {
                            queueCount += modViews[view].length;
                        });
                        // iterate over all registered modules
                        queue.forEach(function (view) {
                            // iterate over all instances of the same view
                            modViews[view].forEach(function (obj) {
                                // hide all (except incoming and parents) TODO but only the parents of the module
                                if (showMods.indexOf(view) === -1) {
                                    obj.fadeOut(function () {
                                        queueCount--;
                                        if (queueCount <= 0) {
                                            fadeIn();
                                        }
                                    });
                                } else {
                                    queueCount--;
                                    if (queueCount <= 0) {
                                        fadeIn();
                                    }
                                }
                            });
                        });
                    },
                    /**
                     * @deprecated use show instead
                     * @param name
                     */
                    showImmediately : function () {    // module specific
                        var showMods = [].slice.call(arguments),
                            queue = Object.keys(modViews),
                            countCb = (function () {
                                var cb, length = 0;
                                // if last param is function than handle it as callback
                                if (typeof showMods[showMods.length - 1] === 'function') {
                                    cb = showMods[showMods.length - 1];
                                }
                                return {
                                    countUp : function (num) {
                                        length += num;
                                    },
                                    reduce : function () {
                                        length--;
                                        if (cb && length <= 0) {
                                            cb();
                                        }
                                    }
                                };
                            }()),
                            show = function () {
                                showMods.forEach(function (module) {
                                    if (modViews.hasOwnProperty(module)) {
                                        countCb.countUp(modViews[module].length);
                                        modViews[module].forEach(function (obj) {
                                            obj.show(countCb.reduce);
                                        });
                                    }
                                });
                            };
                        showMods = fc.addParents(showMods);
                        // hide all (except incoming)
                        queue.forEach(function (view) {
                            modViews[view].forEach(function (obj) {
                                if (showMods.indexOf(obj) === -1) {
                                    obj.hide();
                                }
                            });
                        });
                        show();
                    },
                    overlay : function (name) {
                        var node;
                        // it's own module?
                        if (modViews.hasOwnProperty(name)) {
                            node = modViews[name].getNode();
                        } else {
                            node = document.getElementById(name);
                        }

                        return {
                            by : function (name, text) {
                                return ext[name](node, text);
                            }
                        };
                    }
                };
            return api;
        },
        flowControl = (function () {
            var instances = {};
            return function (name) {
                var instance,
                    def = name || 'flowControl';
                if (instances.hasOwnProperty(def)) {
                    instance = instances[def];
                } else {
                    instances[def] = flowControlInstance(def);
                    instance = instances[def];
                }
                return instance;
            };
        }());
    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) { module.exports = flowControl; } else {canny.add('flowControl', flowControl('flowControl')); }

}());
},{}],55:[function(require,module,exports){
/*global canny */
/*jslint browser: true*/

/**
 * repeat
 *
 * E.g.
 *  <div canny-mod="repeat" canny-var="{'for':'item', 'in':'path.to.list'}">
 *     <p>DATA: {{item}})</p>
 *  </div>
 *  or:
 *  <div canny-mod="repeat" canny-var="{'for':'objectItem', 'in':'path.to.object'}">
 *     <p>DATA FOO: {{objectItem.foo}})</p>
 *     <p>DATA BAR: {{objectItem.bar}})</p>
 *  </div>
 *
 * for:
 * is the name of the iterating item to have access from the DOM.
 *
 * in:
 * is the source where repeat can find the array.
 * It accepts functions, array, and objects pointer
 * - object: keep in mind that object has no specific sorting
 * - array:
 * - function: repeat will call it with the following parameter:
 *  * function which needs to be called with the object or list
 *  * ...
 *
 *  TODO: add example to get data direct from
 *   * a list of function
 *   * a object which contain functions
 *
 */
(function () {
    'use strict';

    var openChar = '{',
        endChar  = '}',
        ESCAPE_RE = /[-.*+?^${}()|[\]\/\\]/g,
        repeat = (function () {
            var BINDING_RE = getRegex();

            /**
             *  Parse a piece of text, return an array of tokens
             *  TODO refactor method
             *  @param text
             *  @return [{key:String, html:boolean}]
             */
            function parse(text) {
                if (!BINDING_RE.test(text)) {return null; }
                var m, i, token, match, tokens = [], orig = {text: text, idx : 0}, textObject;
                /* jshint boss: true */
                while (m = text.match(BINDING_RE)) {
                    i = m.index;
                    token = {concat : true};
                    if (i > 0) {
                        if (orig.idx === 0) {
                            textObject = {
                                concat : orig.text[orig.idx - 1] !== ' ',
                                value : text.slice(0, i),
                                text : true
                            };
                            orig.idx += i;
                        } else {
                            orig.idx += i;
                            textObject = {
                                concat : orig.text[orig.idx - 1] !== ' ',
                                value : text.slice(0, i),
                                text : true
                            };
                        }
                        tokens.push(textObject);
                    }
                    orig.idx += i;
                    token.key = m[1].trim();
                    match = m[0];
                    token.html =
                        match.charAt(2) === openChar &&
                        match.charAt(match.length - 3) === endChar;
                    tokens.push(token);
                    text = text.slice(i + m[0].length);
                }
                if (text.length) {
                    tokens.push({value : text, text : true, concat: true});
                }
                return tokens;
            }
            /**
             *
             * @param node
             * @param dataObj
             * @param itemName
             * @return tokens [{key:String, node:DOM node, html: boolean}]
             */
            function compileTextNode(node, dataObj, itemName) {
                var tokens = parse(node.nodeValue),
                    obj = dataObj,
                    el, token, i, l, tmp, tokenObjectProperty, val;
                if (!tokens || obj === undefined) {return; }

                for (i = 0, l = tokens.length; i < l; i++) {
                    token = tokens[i];
                    if (typeof token === 'object' && token.hasOwnProperty('key')) {
                        tmp = token.key.split('.');

                        if (tmp.length > 0 && tmp[0] === itemName) {

                            if (tmp[0] !== itemName) {
                                // TODO implement error handling if key doesn't match with itemName
                                console.error('repeat:compileTextNode hups something is wrong which needs to be fixed!!! Token with name', token.key, 'doesn\'t match with scope name: ', itemName , ' Repeat will continue but be carefully this "bug" will be removed in next version of repeat!!!');
                            }

                            tokenObjectProperty = tmp.slice(1).join('.');
                            if (typeof obj === 'object') {
                                val = getGlobalCall(tokenObjectProperty, obj);
                            } else {
                                val = obj;
                            }
                        } else {
                            // just a string?
                            val = obj;
                        }
                        if (typeof val === 'string' || typeof val === 'number') {
                            el = document.createTextNode(val);
                            node.parentNode.insertBefore(el, node);
                        } else if (typeof val === 'boolean') {
                            el = document.createTextNode(val.toString());
                            node.parentNode.insertBefore(el, node);
                        } else if (typeof val === 'function') {
                            el = document.createTextNode(val(node.parentNode));
                            node.parentNode.insertBefore(el, node);
                        } else if (tmp[0] === itemName) {
                            // property is not exists but it is the same scope
                            el = document.createTextNode('');
                            node.parentNode.insertBefore(el, node);
                        } else {
                            // restore the token... looks like is not mine
                            el = document.createTextNode('{{' + token.key + '}}');
                            node.parentNode.insertBefore(el, node);
                        }
                        token.node = el;
                    } else {
                        el = document.createTextNode(token.value);
                        // just normal string put back to view
                        node.parentNode.insertBefore(el, node);
                    }
                }
                node.parentNode.removeChild(node);
                return tokens;
            }
            /**
             *
             * @param node
             * @param dataObj
             * @param itemName
             */
            function compileElement (node, dataObj, itemName) {
                // recursively compile childNodes
                if (node.hasChildNodes()) {
                    [].slice.call(node.childNodes).forEach(function (child) {
                        compile(child, dataObj, itemName);
                    });
                }
            }
            /**
             * Compile a DOM node (recursive)
             * @param node
             * @param dataObj
             * @param itemName
             * @returns {*}
             */
            function compile(node, dataObj, itemName) {
                var nodeType = node.nodeType;
                if (nodeType === 1 && node.tagName !== 'SCRIPT') { // a normal node
                    compileElement(node, dataObj, itemName);
                } else if (nodeType === 3) {
                    compileTextNode(node, dataObj, itemName);
                }

                return node;
            }

            /**
             * helper function to do the read variable from string magic.
             * The cb will called with the property value - in case of undefined the variable does not exists
             * @param node
             * @param attributeName
             * @param cb
             */
            function getLoopValueFromAttribute(node, obj, itemName, attributeName, cb) {
                var tmp = node.getAttribute(attributeName).split('.'), tokenObjectProperty;
                if (tmp.length > 0 && tmp[0] === itemName) {
                    tokenObjectProperty = tmp.slice(1).join('.');
                    cb(getGlobalCall(tokenObjectProperty, obj));
                } else {
                    // TODO handle this correctly
                    console.error('repeat:getLoopValueFromAttribute has problems');
                }
            }

            /**
             * register click events
             * 
             * @deprecated use rp-bind attribute
             * 
             * @param clone
             * @param item
             * @param itemName
             */
            function handleEvents(clone, obj, itemName) {
                var onClick = 'on-click';
                // check children of clone
                [].slice.call(clone.querySelectorAll('[' + onClick + ']')).forEach(function (node) {
                    getLoopValueFromAttribute(node, obj, itemName, onClick, function (val) {
                        if (typeof val === 'function') {
                            node.addEventListener('click', val);
                        } else {
                            console.log('repeat:can not register click listener without a function', node);
                        }
                    });
                });
            }

            /**
             * register rp-bind handler
             * 
             * With help of this the if and if-not and onClick attribute is deprecated - you can just pass a function 
             * pointer to rp-bind and do all the required logic by your own.
             * 
             * If you return false then the node will be removed from the DOM
             *
             * @param clone
             * @param obj
             * @param itemName
             */
            function handleRPBindAttribute(clone, obj, itemName) {
                var attrName = 'rp-bind';
                // check children of clone
                [].slice.call(clone.querySelectorAll('[' + attrName + ']')).forEach(function (node) {
                    getLoopValueFromAttribute(node, obj, itemName, attrName, function (val) {
                        if (typeof val === 'function') {
                            if (val(node) === false) {
                                // remove node if function returns false
                               node.parentNode.removeChild(node); 
                            }
                        } else {
                            console.error('repeat:can not register control function without a function pointer', node);
                        }
                    });
                });
            }

            /**
             * Replaces expressions for all tag attributes
             *
             * @param clone
             * @param obj
             * @param itemName (currently not in used but needs to be checked)
             */
            function handleAttributes(containerNode, obj, itemName) {
                var returnTokens = [];
                (function searchForExpressions(children) {
                    [].slice.call(children).forEach(function (node) {
                        var i, attr, rTokens;
                        if (node.children.length > 0) {
                            // do it recursive for all children
                            searchForExpressions(node.children);
                        }
                        // loop through each attribute
                        for (i = 0; i < node.attributes.length; i++) {
                            attr = node.attributes[i];
                            if (/\{\{/.test(attr.textContent)) {
                                if (attr.name) {
                                    rTokens = (function () {
                                        var token = parse(attr.textContent),
                                            endData = [], tmpToken, j, tmpTokenSplit, value;
                                        for (j = 0; j < token.length; j++) {
                                            tmpToken = token[j];
                                            // if token not itemName skipp all
                                            if (tmpToken.key !== undefined && tmpToken.key.split('.')[0] === itemName) {
                                                // save the attribute
                                                tmpToken.attr = attr;
                                                if (/\./.test(tmpToken.key)) {
                                                    tmpTokenSplit = tmpToken.key.split('.').slice(1).join('.');
                                                } else {
                                                    tmpTokenSplit = tmpToken.key;
                                                }
                                                if (typeof obj === 'object') {
                                                    tmpToken.value = getGlobalCall(tmpTokenSplit, obj);
                                                    if (typeof tmpToken.value === 'function') {
                                                        value = tmpToken.value();
                                                    } else {
                                                        value = tmpToken.value;
                                                    }
                                                } else if (typeof obj === 'string') {
                                                    value = obj;
                                                } else if (typeof obj === 'function') {
                                                    value = obj(node);
                                                }

                                            } else if (tmpToken.hasOwnProperty('key')) {
                                                // restore the expression - might be another whisker instance will
                                                // needs this
                                                value = '{{' + tmpToken.key + '}}';
                                            } else {
                                                value = tmpToken.value;
                                            }
                                            endData.push({value : value, concat : tmpToken.concat});
                                        }
                                        attr.textContent = endData.map(function (d) {
                                            return d.concat ? d.value : ' ' + d.value;
                                        }).join('');
                                        return token;
                                    }());
                                    returnTokens = returnTokens.concat(rTokens);
                                }
                            }
                        }
                    });
                }(containerNode.children));
                return returnTokens;
            }

            /**
             * handle the if conditions if and if-not
             * 
             * @deprecated use rp-bind attribute
             * 
             * @param clone
             * @param obj
             * @param itemName
             */
            function handleIfCondition(clone, obj, itemName) {
                var attributeName_if = 'if',
                    attributeName_if_not = 'if-not';

                function checkIf(val, node) {
                    if (!val) {
                        node.parentNode.removeChild(node);
                    }
                }
                function checkIfNot(val, node) {
                    if (val) {
                        node.parentNode.removeChild(node);
                    }
                }
                // check children of clone
                [].slice.call(clone.querySelectorAll('[' +attributeName_if + ']')).forEach(function (node) {
                    getLoopValueFromAttribute(node, obj, itemName, attributeName_if, function (val) {checkIf(val, node);});
                });

                [].slice.call(clone.querySelectorAll('[' +attributeName_if_not + ']')).forEach(function (node) {
                    getLoopValueFromAttribute(node, obj, itemName, attributeName_if_not, function (val) {checkIfNot(val, node);});
                });
            }

            /**
             * Looped through the collection and do the logic for each clone instance.
             * Actually it supports only collection - no objects.
             * @param node
             * @param itemName
             * @param collection
             * @param template
             */
            function registerTemplate(node, itemName, collection, template) {
                var mainFrag;
                if (typeof collection === 'object') {
                    if (Object.prototype.toString.call(collection) === '[object Array]') {
                        // it is an array
                        mainFrag = document.createDocumentFragment();
                        collection.forEach(function (item) {
                            // item could be an object or just a property like a
                            // string (in case of it is direct a list of strings)
                            template.forEach(function (childTpl) {
                                // TODO works also with fragment but then the qunit test fails
                                // - there is a problem with the phantomjs
//                                var fragment = document.createDocumentFragment();
                                var fragment = document.createElement('div');
                                fragment.appendChild(childTpl.cloneNode(true));
                                
                                handleIfCondition(fragment, item, itemName);
                                // if conditions can remove elements from clone - it's important that this is executed first
                                if (fragment.children && fragment.children.length === 1) {
                                    handleRPBindAttribute(fragment, item, itemName);
                                }
                                // rp-bind attribute can also remove elements so need to check again if node exists
                                if (fragment.children && fragment.children.length === 1) {
                                    handleEvents(fragment, item, itemName);
                                    handleAttributes(fragment, item, itemName);
                                    // replace texts:
                                    mainFrag.appendChild(compile(fragment.children[0], item, itemName));
                                } else {
                                   // console.log('repeat:element has been removed from DOM');
                                }
                            });
                        });
                        node.appendChild(mainFrag);
                    } else {
                        // it is an object
                        console.error('repeat detect object but object currently not supported');
                        // what render? - property name or value? - Both?
                    }
                } else {
                    console.error('repeat:registerTemplate detect none acceptable data argument', collection);
                }
            }

            /**
             * Create a new repeat instance and do the "magic".
             * @param node
             * @param scopeName
             * @param data {[], function}
             */
            function execRepeat(node, scopeName, data) {
                var template = [];
                [].slice.call(node.children).forEach(function (child) {
                    template.push(node.removeChild(child));
                });

                if (typeof data === 'function') {
                    data(function (name, data) {
                        if (data) {
                            scopeName = name;
                        } else {
                            data = name;
                        }
                        // better would be a update children but this is much effort to detect
                        [].slice.call(node.children).forEach(function (child) {
                            node.removeChild(child);
                        });
                        registerTemplate(node, scopeName, data, template);
                    });
                } else {
                    registerTemplate(node, scopeName, data, template)
                }
            }

            return {
                /**
                 * the attribute requires:
                 *  for: name of the iterator
                 *  in: pointer to: function, array or object
                 *
                 * @param node
                 * @param attr {{for:string,in:string}}
                 */
                add : function (node, attr) {
                    var inPointer;
                    if (typeof attr === 'object' && attr.in && attr.for) {
                        if (typeof attr.in === 'string') {
                            // TODO replace window with this and also other instances could use the magic as closure
                            inPointer = getGlobalCall(attr.in, window);
                        } else {
                            inPointer = attr.in;
                        }
                        execRepeat(node, attr.for || 'item', inPointer);
                    } else if (Object.prototype.toString.call(attr) === '[object Array]') {
                        execRepeat(node, 'item', attr);
                    } else if (typeof attr === 'function') {
                        execRepeat(node, 'item', attr);
                    } else if (typeof attr === 'string') {
                        inPointer = getGlobalCall(attr, window);
                        execRepeat(node, 'item', inPointer);
                    } else {
                        console.warn('repeat:add none acceptable attributes', attr);
                    }
                }
            };
        }());

    function escapeRegex(str) {
        return str.replace(ESCAPE_RE, '\\$&');
    }

    function getRegex() {
        var open = escapeRegex(openChar),
            end  = escapeRegex(endChar);
        return new RegExp(open + open + open + '?(.+?)' + end + '?' + end + end);
    }

    /**
     * Read a property from a given string and object.
     * Returns the founded property pointer or undefined.
     * @param value
     * @param obj
     * @returns {*} or undefined
     */
    function getGlobalCall (value, obj) {
        var split = value.split('.'),
            rec = function (cur) {
                if (obj[cur] !== undefined) {
                    obj = obj[cur];
                    rec(split.shift());
                } else if (cur === value ) {
                    obj = undefined;
                }
            };
        rec(split.shift());
        return obj;
    }

    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) {
        module.exports = repeat;
    } else {
        canny.add('repeat', repeat);
    }

}());

},{}],56:[function(require,module,exports){
/*global canny */
/*jslint browser: true*/
/**
 *
 * E.g. {{whisker}}:
 *  <div canny-mod="whisker" canny-var="{'bind':'scope','to':{'message':'My text'}}">
 *     <p>DATA: {{scope.message}})</p>
 *  </div>
 *  Or just pass the function pointer the default scope is 'scope'.
 *  <div canny-mod="whisker" canny-var="mymodule.functionPointer">
 *     <p>DATA: {{scope.message}})</p>
 *  </div>
 *
 */
(function () {
    "use strict";

    var openChar = '{',
        endChar  = '}',
        ESCAPE_RE = /[-.*+?^${}()|[\]\/\\]/g,
        whisker = (function () {
            var BINDING_RE = getRegex();
            /**
             *  Parse a piece of text, return an array of tokens
             *  TODO refactor method
             *  @param text
             *  @return [{key:String, html:boolean}]
             */
            function parse(text) {
                if (!BINDING_RE.test(text)) {return null; }
                var m, i, token, match, tokens = [], orig = {text: text, idx : 0}, textObject;
                /* jshint boss: true */
                while (m = text.match(BINDING_RE)) {
                    i = m.index;
                    token = {concat : true};
                    if (i > 0) {
                        if (orig.idx === 0) {
                            textObject = {
                                concat : orig.text[orig.idx - 1] !== ' ',
                                value : text.slice(0, i),
                                text : true
                            };
                            orig.idx += i;
                        } else {
                            orig.idx += i;
                            textObject = {
                                concat : orig.text[orig.idx - 1] !== ' ',
                                value : text.slice(0, i),
                                text : true
                            };
                        }
                        tokens.push(textObject);
                    }
                    orig.idx += i;
                    token.key = m[1].trim();
                    match = m[0];
                    token.html =
                        match.charAt(2) === openChar &&
                        match.charAt(match.length - 3) === endChar;
                    tokens.push(token);
                    text = text.slice(i + m[0].length);
                }
                if (text.length) {
                    tokens.push({value : text, text : true, concat: true});
                }
                return tokens;
            }
            /**
             *
             * @param node
             * @param dataObj
             * @param itemName
             * @return tokens [{key:String, node:DOM node, html: boolean}]
             */
            function compileTextNode(node, dataObj, itemName) {
                var tokens = parse(node.nodeValue),
                    obj = dataObj,
                    el, token, i, l, tmp, tokenObjectProperty, val, valUnknown;
                if (!tokens || obj === undefined || typeof obj === 'string') {return; }

                for (i = 0, l = tokens.length; i < l; i++) {
                    token = tokens[i];

                    if (typeof token === 'object' && token.hasOwnProperty('key')) {
                        tmp = token.key.split('.');
                        if (tmp.length > 0 && tmp[0] === itemName) {
                            tokenObjectProperty = tmp.slice(1).join('.');
                            if (typeof obj === 'object') {
                                valUnknown = getGlobalCall(tokenObjectProperty, obj);
                            } else {
                                valUnknown = obj;
                            }
                        } else {
                            // just a string?
                            valUnknown = obj;
                        }

                        if (typeof valUnknown === 'function') {
                            val = valUnknown(node);
                        } else {
                            val = valUnknown;
                        }

                        if (typeof val === 'string' || typeof val === 'number') {
                            el = document.createTextNode(val);
                            node.parentNode.insertBefore(el, node);
                        } else if (typeof val === 'boolean') {
                            el = document.createTextNode(val.toString());
                            node.parentNode.insertBefore(el, node);
                        } else if (val instanceof HTMLElement) {
                            el = val;
                            node.parentNode.insertBefore(el, node);
                        } else if (tmp[0] === itemName) {
                            // property is not exists but it is the same scope
                            el = document.createTextNode('');
                            node.parentNode.insertBefore(el, node);
                        } else {
                            // restore the token... looks like is not mine
                            el = document.createTextNode('{{' + token.key + '}}');
                            node.parentNode.insertBefore(el, node);
                        }
                        token.node = el;
                    } else {
                        el = document.createTextNode(token.value);
                        // just normal string put back to view
                        node.parentNode.insertBefore(el, node);
                    }
                }
                node.parentNode.removeChild(node);
                return tokens;
            }
            /**
             *
             * @param node
             * @param dataObj
             * @param itemName
             */
            function compileElement (node, dataObj, itemName) {
                var tokens = [],
                    token;
                // recursively compile childNodes
                if (node.hasChildNodes()) {
                    [].slice.call(node.childNodes).forEach(function (child) {
                        token = compile(child, dataObj, itemName);
                        if (token) {
                            tokens = tokens.concat(token);
                        }
                    });
                }
                return tokens.length > 0 ? tokens : undefined;
            }


            /**
             * helper function to do the read variable from string magic.
             * The cb will called with the property value - in case of undefined the variable does not exists
             * 
             * @param node
             * @param obj
             * @param itemName
             * @param attributeName
             * 
             * @return {function} | false if it is not a function or not available 
             */
            function getWkBindValue(node, obj, itemName, attributeName) {
                var tmp = node.getAttribute(attributeName).split('.'), tokenObjectProperty;
                if (tmp.length > 0 && tmp[0] === itemName) {
                    tokenObjectProperty = tmp.slice(1).join('.');
                    return getGlobalCall(tokenObjectProperty, obj) || false;
                }
                return false;
            }

            /**
             * register rp-bind handler
             *
             * With help of this the if and if-not and onClick attribute is deprecated - you can just pass a function pointer to rp-bind and
             * do all the required logic by your own.
             *
             * If you return false then the node will be removed from the DOM
             *
             * @param node
             * @param obj
             * @param scopeName
             */
            function handleWKBindAttribute(node, obj, scopeName) {

                function parseChildAttribute(child, data, scopeName) {
                    var attrName = 'wk-bind',
                        key = child.getAttribute('wk-bind'),
                        token,
                        fc = getWkBindValue(child, data, scopeName, attrName);
                    if (fc) {
                        (function (fc) {
                            var shadow,
                                hidden = false;
                            if (typeof fc === 'function') {
                                shadow = document.createElement('div');
                                shadow.style.display = 'none';
                                if (fc(child) === false) {
                                    // remove node if function returns false
                                    child = child.parentNode.replaceChild(shadow, child);
                                    hidden = true;
                                }
                                token = {
                                    hidden : hidden,
                                    node : child,
                                    shadowNode : shadow,
                                    isWkBindToken : true,
                                    // check if key is needed because it has the wkBind function pointer
                                    key : child.getAttribute('wk-bind')
                                }

                            } else {
                                console.error('whisker:can not register control function without a function pointer', child);
                            }
                        }(fc));
                    } else {
                        // valid in case of there is a different scope variable or
                    }
                    return token;
                }

                var attrName = 'wk-bind',
                    tokens = [];
                // check children of clone
                [].slice.call(node.querySelectorAll('[' + attrName + ']')).forEach(function (child) {
                    var tmpToken = parseChildAttribute(child, obj, scopeName);
                    if (tmpToken) {
                        tokens.push(tmpToken);
                    }
                });
                return tokens
            }

            /**
             *  Compile a DOM node (recursive)
             * @param node
             * @param dataObj
             * @param itemName
             * @returns {*}
             */
            function compile(node, dataObj, itemName) {
                var nodeType = node.nodeType,
                    tokens = [],
                    token;
                if (nodeType === 1 && node.tagName !== 'SCRIPT') { // a normal node
                    token = compileElement(node, dataObj, itemName);
                    if (token) {
                        tokens = tokens.concat(token);
                    }
                } else if (nodeType === 3) {
                    token = compileTextNode(node, dataObj, itemName);
                    if (token) {
                        tokens = tokens.concat(token);
                    }
                }
                return tokens.length > 0 ? tokens : undefined;
            }

            /**
             * Replaces expressions for all tag attributes
             *
             * loop though all children and check if a attribute has a expressions inside
             *
             * @param containerNode
             * @param obj
             * @param itemName
             * @return returnTokens [{key:String, attr: node attribute reference, html: boolean}]
             */
            function handleAttributes(containerNode, obj, itemName) {
                var returnTokens = [];
                (function searchForExpressions(children) {
                    [].slice.call(children).forEach(function (node) {
                        var i, attr, rTokens;
                        if (node.children.length > 0) {
                            // do it recursive for all children
                            searchForExpressions(node.children);
                        }
                        // loop through each attribute
                        for (i = 0; i < node.attributes.length; i++) {
                            attr = node.attributes[i];
                            if (/\{\{/.test(attr.textContent)) {
                                if (attr.name) {
                                    rTokens = (function () {
                                        var token = parse(attr.textContent),
                                            endData = [], tmpToken, j, tmpTokenSplit, value, tmpValue;
                                        for (j = 0; j < token.length; j++) {
                                            tmpToken = token[j];
                                            // if token not itemName skipp all
                                            if (tmpToken.key !== undefined && tmpToken.key.split('.')[0] === itemName) {
                                                // save the attribute
                                                tmpToken.attr = attr;
                                                if (/\./.test(tmpToken.key)) {
                                                    tmpTokenSplit = tmpToken.key.split('.').slice(1).join('.');
                                                } else {
                                                    tmpTokenSplit = tmpToken.key;
                                                }
                                                if (typeof obj === 'object') {
                                                    tmpValue = getGlobalCall(tmpTokenSplit, obj);
                                                    if (typeof tmpValue === 'function') {
                                                        tmpToken.value = tmpValue(node);
                                                        tmpToken.node = node;
                                                    } else {
                                                        tmpToken.value = tmpValue;
                                                    }
                                                    value = tmpToken.value;
                                                } else if (typeof obj === 'string') {
                                                    value = obj;
                                                } else if (typeof obj === 'function') {
                                                    value = obj(node);
                                                }

                                            } else if (tmpToken.hasOwnProperty('key')) {
                                                // restore the expression - might be another whisker instance will
                                                // needs this
                                                value = '{{' + tmpToken.key + '}}';
                                            } else {
                                                value = tmpToken.value;
                                            }
                                            endData.push({value : value, concat : tmpToken.concat});
                                        }
                                        attr.textContent = endData.map(function (d) {
                                            return d.concat ? d.value : ' ' + d.value;
                                        }).join('');
                                        return token;
                                    }());
                                    returnTokens = returnTokens.concat(rTokens);
                                }
                            }
                        }
                    });
                }(containerNode.children));
                return returnTokens;
            }

            /**
             * do the magic for attributes or text nodes
             * 
             * TODO: bug if property doesn't exists in first execution it want work anymore for attributes and wk-bind
             *  See: whiskerSpecs.js > dynamicallyChangeDataWithInitialMissingProperties
             *
             * @param node
             * @param scopeName
             * @param data
             */
            function fillData(node, scopeName, data) {
                var tokens = [];
                if (typeof data === 'object') {
                    // handleEvents(node, data, scopeName);
                    tokens = tokens.concat(handleAttributes(node, data, scopeName));
                    // make sure that the compiler also updates the hidden element
                    tokens = tokens.concat(compile(node, data, scopeName));

                    tokens = tokens.concat(handleWKBindAttribute(node, data, scopeName));

                    // replace texts:
                    return tokens;
                } else {
                    console.error('whisker:handleAttributes detect none acceptable data argument', data);
                }
            }

            /**
             * helper function for updateData to update the DOM Elements
             * @param token
             * @param domElement DOMElement
             */
            function updateDOMElement(token, domElement) {
                token.node.parentNode.insertBefore(domElement, token.node);
                token.node.parentNode.removeChild(token.node);
                token.node = domElement;
            }
            /**
             * helper function for updateData to update the text nodes
             * @param token
             * @param val
             */
            function updateText(token, val) {
                var textNode;
                if (token.node instanceof HTMLElement) {
                    // convert back to textNode
                    textNode = document.createTextNode('');
                    token.node.parentNode.insertBefore(textNode, token.node);
                    token.node.parentNode.removeChild(token.node);
                    token.node = textNode;
                }
                if (typeof val === 'string' || typeof val === 'number') {
                    token.node.nodeValue = val;
                } else if (typeof val === 'boolean') {
                    // TODO test
                    token.node.nodeValue = val.toString();
                }
            }

            /**
             * helper function for updateData to update the attributes for a node
             * @param token
             * @param value
             */
            function updateAttributes(token, value) {
                var val;
                if (typeof value === 'function') {
                    val = value(token.node);
                } else {
                    val = value;
                }
                if (typeof val === 'string' || typeof val === 'number') {
                    var replaceText = token.attr.textContent;
                    if (replaceText) {
                        token.attr.textContent = replaceText.replace(token.value, val);
                    } else {
                        token.attr.textContent = replaceText + val;
                    }
                    token.value = val;
                } else if (typeof val === 'boolean') {
                    // TODO test (makes no sense for an attribute but needs to be handled correctly (think about what to do in this case)
                    token.node.nodeValue = val.toString();
                }
            }
            /**
             *
             * Call this to update the existing data's
             *
             * TODO test also boolean and function
             *
             * @param tokenObjList [{key : "scopeName.property", node}]
             * @param scopeName
             * @param obj
             */
            function updateData(tokenObjList, scopeName, obj) {
                tokenObjList.forEach(function (token) {
                    if (token && token.hasOwnProperty('key')) {
                        var tmp = token.key.split('.'), tokenObjectProperty, val;
                        if (tmp.length > 0 && tmp[0] === scopeName) {
                            tokenObjectProperty = tmp.slice(1).join('.');
                            if (typeof obj === 'object') {
                                val = getGlobalCall(tokenObjectProperty, obj);
                            } else {
                                val = obj;
                            }

                            if (val !== undefined) {
                                if (token.hasOwnProperty('attr')) {
                                    // handle attribute
                                    updateAttributes(token, val);
                                } else if (token.isWkBindToken) {
                                    (function () {
                                        var removeMeIfImFalse;
                                        if (val) {
                                            removeMeIfImFalse = val(token.node);
                                        }
                                        if (removeMeIfImFalse === false && token.hidden === false) {
                                            // remove node
                                            token.hidden = true;
                                            token.node.parentNode.replaceChild(token.shadowNode, token.node);
                                        } else if (removeMeIfImFalse !== false && token.hidden) {
                                            token.hidden = false;
                                            token.shadowNode.parentNode.replaceChild(token.node, token.shadowNode);
                                            // restore node
                                        }
                                    }());
                                } else {
                                    (function () {
                                        // a return result could also be a HTMLElement
                                        var res = typeof val === 'function' ? val(token.node) : val;
                                        if (res instanceof HTMLElement) {
                                            updateDOMElement(token, res);
                                        } else {
                                            updateText(token, res);
                                        }
                                    }(val))
                                }
                            }
                        }
                    }
                });
            }

            /**
             * TODO description
             * Create a new whisker instance and do the "magic".
             * @param node
             * @param scopeName
             * @param data
             */
            function exec(node, data, scopeName) {
                var currentScope = scopeName || 'item',
                    keyValueholder = {};
                if (typeof data === 'function') {
                    data(function (scope, data) {
                        var renderScope;
                        if (data !== undefined) {
                            renderScope = currentScope = scope || currentScope;
                        } else {
                            data = scope;
                            // otherwise use the scope from the initialisation
                            renderScope = currentScope;
                        }
                        if (keyValueholder.hasOwnProperty(renderScope)) {
                            updateData(keyValueholder[renderScope], renderScope, data);
                        } else {
                            keyValueholder[renderScope] = fillData(node, renderScope, data);
                        }
                    });
                } else {
                    fillData(node, currentScope, data)
                }
            }

            return {
                add : function (node, attr) {
                    var inPointer;
                    if (typeof attr === 'object') {
                        if (attr.to && attr.bind) {
                            if (typeof attr.to === 'string') {
                                // TODO replace window with this and also other instances could use the magic as closure
                                inPointer = getGlobalCall(attr.to, window);
                            } else {
                                inPointer = attr.to;
                            }
                        } else {
                            inPointer = attr;
                        }
                        exec(node, inPointer, attr.bind || 'item');
                    } else if (typeof attr === 'string') {
                        inPointer = getGlobalCall(attr, window);
                        if (typeof inPointer === 'function') {
                            exec(node, inPointer);
                        } else {
                            console.warn('whisker:add none acceptable attributes', attr);
                        }
                    } else {
                        exec(node, attr);
                    }
                }
            };
        }());

    function escapeRegex(str) {
        return str.replace(ESCAPE_RE, '\\$&');
    }

    function getRegex() {
        var open = escapeRegex(openChar),
            end  = escapeRegex(endChar);
        return new RegExp(open + open + open + '?(.+?)' + end + '?' + end + end);
    }

    /**
     * Read a property from a given string and object.
     * Returns the founded property pointer or undefined.
     * @param value
     * @param obj
     * @returns {*} or undefined
     */
    function getGlobalCall (value, obj) {
        var split = value.split('.'),
            rec = function (cur) {
                if (obj[cur] !== undefined) {
                    obj = obj[cur];
                    rec(split.shift());
                } else if (cur === value ) {
                    obj = undefined;
                }
            };
        rec(split.shift());
        return obj;
    }

    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) {
        module.exports = whisker;
    } else {
        canny.add('whisker', whisker);
    }

}());

},{}],57:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":69}],58:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter;
var scrubber = require('./lib/scrub');
var objectKeys = require('./lib/keys');
var forEach = require('./lib/foreach');
var isEnumerable = require('./lib/is_enum');

module.exports = function (cons, opts) {
    return new Proto(cons, opts);
};

(function () { // browsers bleh
    for (var key in EventEmitter.prototype) {
        Proto.prototype[key] = EventEmitter.prototype[key];
    }
})();

function Proto (cons, opts) {
    var self = this;
    EventEmitter.call(self);
    if (!opts) opts = {};
    
    self.remote = {};
    self.callbacks = { local : [], remote : [] };
    self.wrap = opts.wrap;
    self.unwrap = opts.unwrap;
    
    self.scrubber = scrubber(self.callbacks.local);
    
    if (typeof cons === 'function') {
        self.instance = new cons(self.remote, self);
    }
    else self.instance = cons || {};
}

Proto.prototype.start = function () {
    this.request('methods', [ this.instance ]);
};

Proto.prototype.cull = function (id) {
    delete this.callbacks.remote[id];
    this.emit('request', {
        method : 'cull',
        arguments : [ id ]
    });
};

Proto.prototype.request = function (method, args) {
    var scrub = this.scrubber.scrub(args);
    
    this.emit('request', {
        method : method,
        arguments : scrub.arguments,
        callbacks : scrub.callbacks,
        links : scrub.links
    });
};

Proto.prototype.handle = function (req) {
    var self = this;
    var args = self.scrubber.unscrub(req, function (id) {
        if (self.callbacks.remote[id] === undefined) {
            // create a new function only if one hasn't already been created
            // for a particular id
            var cb = function () {
                self.request(id, [].slice.apply(arguments));
            };
            self.callbacks.remote[id] = self.wrap ? self.wrap(cb, id) : cb;
            return cb;
        }
        return self.unwrap
            ? self.unwrap(self.callbacks.remote[id], id)
            : self.callbacks.remote[id]
        ;
    });
    
    if (req.method === 'methods') {
        self.handleMethods(args[0]);
    }
    else if (req.method === 'cull') {
        forEach(args, function (id) {
            delete self.callbacks.local[id];
        });
    }
    else if (typeof req.method === 'string') {
        if (isEnumerable(self.instance, req.method)) {
            self.apply(self.instance[req.method], args);
        }
        else {
            self.emit('fail', new Error(
                'request for non-enumerable method: ' + req.method
            ));
        }
    }
    else if (typeof req.method == 'number') {
        var fn = self.callbacks.local[req.method];
        if (!fn) {
            self.emit('fail', new Error('no such method'));
        }
        else self.apply(fn, args);
    }
};

Proto.prototype.handleMethods = function (methods) {
    var self = this;
    if (typeof methods != 'object') {
        methods = {};
    }
    
    // copy since assignment discards the previous refs
    forEach(objectKeys(self.remote), function (key) {
        delete self.remote[key];
    });
    
    forEach(objectKeys(methods), function (key) {
        self.remote[key] = methods[key];
    });
    
    self.emit('remote', self.remote);
    self.emit('ready');
};

Proto.prototype.apply = function (f, args) {
    try { f.apply(undefined, args) }
    catch (err) { this.emit('error', err) }
};

},{"./lib/foreach":59,"./lib/is_enum":60,"./lib/keys":61,"./lib/scrub":62,"events":66}],59:[function(require,module,exports){
module.exports = function forEach (xs, f) {
    if (xs.forEach) return xs.forEach(f)
    for (var i = 0; i < xs.length; i++) {
        f.call(xs, xs[i], i);
    }
}

},{}],60:[function(require,module,exports){
var objectKeys = require('./keys');

module.exports = function (obj, key) {
    if (Object.prototype.propertyIsEnumerable) {
        return Object.prototype.propertyIsEnumerable.call(obj, key);
    }
    var keys = objectKeys(obj);
    for (var i = 0; i < keys.length; i++) {
        if (key === keys[i]) return true;
    }
    return false;
};

},{"./keys":61}],61:[function(require,module,exports){
module.exports = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

},{}],62:[function(require,module,exports){
var traverse = require('traverse');
var objectKeys = require('./keys');
var forEach = require('./foreach');

function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) if (xs[i] === x) return i;
    return -1;
}

// scrub callbacks out of requests in order to call them again later
module.exports = function (callbacks) {
    return new Scrubber(callbacks);
};

function Scrubber (callbacks) {
    this.callbacks = callbacks;
}

// Take the functions out and note them for future use
Scrubber.prototype.scrub = function (obj) {
    var self = this;
    var paths = {};
    var links = [];
    
    var args = traverse(obj).map(function (node) {
        if (typeof node === 'function') {
            var i = indexOf(self.callbacks, node);
            if (i >= 0 && !(i in paths)) {
                // Keep previous function IDs only for the first function
                // found. This is somewhat suboptimal but the alternatives
                // are worse.
                paths[i] = this.path;
            }
            else {
                var id = self.callbacks.length;
                self.callbacks.push(node);
                paths[id] = this.path;
            }
            
            this.update('[Function]');
        }
        else if (this.circular) {
            links.push({ from : this.circular.path, to : this.path });
            this.update('[Circular]');
        }
    });
    
    return {
        arguments : args,
        callbacks : paths,
        links : links
    };
};
 
// Replace callbacks. The supplied function should take a callback id and
// return a callback of its own.
Scrubber.prototype.unscrub = function (msg, f) {
    var args = msg.arguments || [];
    forEach(objectKeys(msg.callbacks || {}), function (sid) {
        var id = parseInt(sid, 10);
        var path = msg.callbacks[id];
        traverse.set(args, path, f(id));
    });
    
    forEach(msg.links || [], function (link) {
        var value = traverse.get(args, link.from);
        traverse.set(args, link.to, value);
    });
    
    return args;
};

},{"./foreach":59,"./keys":61,"traverse":99}],63:[function(require,module,exports){
var dnode = require('./lib/dnode');

module.exports = function (cons, opts) {
    return new dnode(cons, opts);
};

},{"./lib/dnode":64}],64:[function(require,module,exports){
(function (process){
var protocol = require('dnode-protocol');
var Stream = require('stream');
var json = typeof JSON === 'object' ? JSON : require('jsonify');

module.exports = dnode;
dnode.prototype = {};
(function () { // browsers etc
    for (var key in Stream.prototype) {
        dnode.prototype[key] = Stream.prototype[key];
    }
})();

function dnode (cons, opts) {
    Stream.call(this);
    var self = this;
    
    self.opts = opts || {};
    
    self.cons = typeof cons === 'function'
        ? cons
        : function () { return cons || {} }
    ;
    
    self.readable = true;
    self.writable = true;
    
    process.nextTick(function () {
        if (self._ended) return;
        self.proto = self._createProto();
        self.proto.start();
        
        if (!self._handleQueue) return;
        for (var i = 0; i < self._handleQueue.length; i++) {
            self.handle(self._handleQueue[i]);
        }
    });
}

dnode.prototype._createProto = function () {
    var self = this;
    var proto = protocol(function (remote) {
        if (self._ended) return;
        
        var ref = self.cons.call(this, remote, self);
        if (typeof ref !== 'object') ref = this;
        
        self.emit('local', ref, self);
        
        return ref;
    }, self.opts.proto);
    
    proto.on('remote', function (remote) {
        self.emit('remote', remote, self);
        self.emit('ready'); // backwards compatability, deprecated
    });
    
    proto.on('request', function (req) {
        if (!self.readable) return;
        
        if (self.opts.emit === 'object') {
            self.emit('data', req);
        }
        else self.emit('data', json.stringify(req) + '\n');
    });
    
    proto.on('fail', function (err) {
        // errors that the remote end was responsible for
        self.emit('fail', err);
    });
    
    proto.on('error', function (err) {
        // errors that the local code was responsible for
        self.emit('error', err);
    });
    
    return proto;
};

dnode.prototype.write = function (buf) {
    if (this._ended) return;
    var self = this;
    var row;
    
    if (buf && typeof buf === 'object'
    && buf.constructor && buf.constructor.name === 'Buffer'
    && buf.length
    && typeof buf.slice === 'function') {
        // treat like a buffer
        if (!self._bufs) self._bufs = [];
        
        // treat like a buffer
        for (var i = 0, j = 0; i < buf.length; i++) {
            if (buf[i] === 0x0a) {
                self._bufs.push(buf.slice(j, i));
                
                var line = '';
                for (var k = 0; k < self._bufs.length; k++) {
                    line += String(self._bufs[k]);
                }
                
                try { row = json.parse(line) }
                catch (err) { return self.end() }
                
                j = i + 1;
                
                self.handle(row);
                self._bufs = [];
            }
        }
        
        if (j < buf.length) self._bufs.push(buf.slice(j, buf.length));
    }
    else if (buf && typeof buf === 'object') {
        // .isBuffer() without the Buffer
        // Use self to pipe JSONStream.parse() streams.
        self.handle(buf);
    }
    else {
        if (typeof buf !== 'string') buf = String(buf);
        if (!self._line) self._line = '';
        
        for (var i = 0; i < buf.length; i++) {
            if (buf.charCodeAt(i) === 0x0a) {
                try { row = json.parse(self._line) }
                catch (err) { return self.end() }
                
                self._line = '';
                self.handle(row);
            }
            else self._line += buf.charAt(i)
        }
    }
};

dnode.prototype.handle = function (row) {
    if (!this.proto) {
        if (!this._handleQueue) this._handleQueue = [];
        this._handleQueue.push(row);
    }
    else this.proto.handle(row);
};

dnode.prototype.end = function () {
    if (this._ended) return;
    this._ended = true;
    this.writable = false;
    this.readable = false;
    this.emit('end');
};

dnode.prototype.destroy = function () {
    this.end();
};

}).call(this,require('_process'))
},{"_process":74,"dnode-protocol":58,"jsonify":70,"stream":97}],65:[function(require,module,exports){
/*global HTMLElement */
/*jslint browser: true */

var domOpts = {};

domOpts.params = (function () {
    "use strict";
    var params = {}, i, nv, parts;
    if (location.search) {
        parts = location.search.substring(1).split('&');
        for (i = 0; i < parts.length; i++) {
            nv = parts[i].split('=');
            if (nv[0]) {
                params[nv[0]] = nv[1] || true;
            }
        }
    }
    return params;
}());

domOpts.createElement = function (tag, id, classes) {
    "use strict";
    var newNode = document.createElement(tag);
    if (id) {newNode.setAttribute('id', id); }
    if (classes) {newNode.setAttribute('class', classes); }
    return newNode;
};
module.exports =  domOpts;

// dom operations:
HTMLElement.prototype.domAddClass = function (addClasses) {
    "use strict";
    var attrClass = this.getAttribute('class'),
        addClassesList = addClasses.split(' '), newClasses = [], i;
    for (i = 0; i < addClassesList.length; i++) {
        if (!this.domHasClass(addClassesList[i])) {
            newClasses.push(addClassesList[i]);
        }
    }
    this.setAttribute('class', attrClass !== null ? attrClass + ' ' + newClasses.join(' ') : newClasses.join(' '));
    return this;
};
// TODO remove all classes with same name
HTMLElement.prototype.domRemoveClass = function (removeableClasses) {
    "use strict";
    var removeClasses = (removeableClasses && removeableClasses.split(' ')) || this.getAttribute('class').split(' '),
        attrClass = this.getAttribute('class'),
        currentClasses,
        i,
        idx;
    if (attrClass !== null) {
        currentClasses = attrClass.split(' ');
        for (i = 0; i < removeClasses.length; i++) {
            idx = currentClasses.indexOf(removeClasses[i]);
            if (idx >= 0) {
                currentClasses = currentClasses.slice(0, idx).concat(currentClasses.slice(idx + 1, currentClasses.length - 1));
            }
        }
        this.setAttribute('class', currentClasses.join(' '));
    }
    return this;
};

// dom operations:
HTMLElement.prototype.domHasClass = function (className) {
    "use strict";
    var classes = this.getAttribute('class'), currentClasses, i;
    if (classes !== null) {
        currentClasses = classes.split(' ');
        for (i = 0; i < currentClasses.length; i++) {
            if (currentClasses[i] === className) {return true; }
        }
    }
    return false;
};

HTMLElement.prototype.domRemove = function () {
    "use strict";
    this.parentNode.removeChild(this);
};
/**
 * remove all child elements from node
 */
HTMLElement.prototype.domEmpty = function () {
    "use strict";
    Array.prototype.slice.call(this.children).forEach(function (child) {
        child.domRemove(this);
    });
};

HTMLElement.prototype.domAppendTo = function (elem) {
    "use strict";
    var node = elem;
    if (typeof node === 'string') {
        node = document.getElementById(node);
    }
    node.appendChild(this);
    return this;
};

HTMLElement.prototype.domAppendChild = function (elem) {
    "use strict";
    var node = elem;
    if (typeof node === 'string') {
        node = document.getElementById(node);
    }
    this.appendChild(node);
    return this;
};

HTMLElement.prototype.domChildTags = function (tag) {
    "use strict";
    var tags = [];
    Array.prototype.slice.call(this.children).forEach(function (e) {
        if (e.tagName.toLowerCase() === tag.toLowerCase()) {
            tags.push(e);
        }
    });
    return tags;
};
},{}],66:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],67:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],68:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],69:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],70:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":71,"./lib/stringify":72}],71:[function(require,module,exports){
var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

module.exports = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

},{}],72:[function(require,module,exports){
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

module.exports = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

},{}],73:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))
},{"_process":74}],74:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],75:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],76:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],77:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],78:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":76,"./encode":77}],79:[function(require,module,exports){
module.exports = require('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":80}],80:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":82,"./_stream_writable":84,"core-util-is":57,"inherits":68,"process-nextick-args":73}],81:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":83,"core-util-is":57,"inherits":68}],82:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":80,"./internal/streams/BufferList":85,"./internal/streams/destroy":86,"./internal/streams/stream":87,"_process":74,"core-util-is":57,"events":66,"inherits":68,"isarray":88,"process-nextick-args":73,"safe-buffer":94,"string_decoder/":89,"util":49}],83:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":80,"core-util-is":57,"inherits":68}],84:[function(require,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"./_stream_duplex":80,"./internal/streams/destroy":86,"./internal/streams/stream":87,"_process":74,"core-util-is":57,"inherits":68,"process-nextick-args":73,"safe-buffer":94,"timers":98,"util-deprecate":102}],85:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":94,"util":49}],86:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":73}],87:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":66}],88:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],89:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":94}],90:[function(require,module,exports){
module.exports = require('./readable').PassThrough

},{"./readable":91}],91:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":80,"./lib/_stream_passthrough.js":81,"./lib/_stream_readable.js":82,"./lib/_stream_transform.js":83,"./lib/_stream_writable.js":84}],92:[function(require,module,exports){
module.exports = require('./readable').Transform

},{"./readable":91}],93:[function(require,module,exports){
module.exports = require('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":84}],94:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":50}],95:[function(require,module,exports){
var Stream = require('stream');
var sockjs = require('sockjs-client');
var resolve = require('url').resolve;
var parse = require('url').parse;

module.exports = function (u, cb) {
    var uri = parse(u).protocol ? u : resolve(window.location.href, u);
    
    var stream = new Stream;
    stream.readable = true;
    stream.writable = true;
    
    var ready = false;
    var buffer = [];
    
    var sock = sockjs(uri);
    stream.sock = sock;
    
    stream.write = function (msg) {
        if (!ready || buffer.length) buffer.push(msg)
        else sock.send(msg)
    };
    
    stream.end = function (msg) {
        if (msg !== undefined) stream.write(msg);
        if (!ready) {
            stream._ended = true;
            return;
        }
        stream.writable = false;
        sock.close();
    };
    
    stream.destroy = function () {
        stream._ended = true;
        stream.writable = stream.readable = false;
        buffer.length = 0
        sock.close();
    };
    
    sock.onopen = function () {
        if (typeof cb === 'function') cb();
        ready = true;
        for (var i = 0; i < buffer.length; i++) {
            sock.send(buffer[i]);
        }
        buffer = [];
        stream.emit('connect');
        if (stream._ended) stream.end();
    };
    
    sock.onmessage = function (e) {
        stream.emit('data', e.data);
    };
    
    sock.onclose = function () {
        stream.emit('end');
        stream.writable = false;
        stream.readable = false;
    };
    
    return stream;
};

},{"sockjs-client":96,"stream":97,"url":100}],96:[function(require,module,exports){
/* SockJS client, version 0.3.1.7.ga67f.dirty, http://sockjs.org, MIT License

Copyright (c) 2011-2012 VMware, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JSON2 by Douglas Crockford (minified).
var JSON;JSON||(JSON={}),function(){function str(a,b){var c,d,e,f,g=gap,h,i=b[a];i&&typeof i=="object"&&typeof i.toJSON=="function"&&(i=i.toJSON(a)),typeof rep=="function"&&(i=rep.call(b,a,i));switch(typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";gap+=indent,h=[];if(Object.prototype.toString.apply(i)==="[object Array]"){f=i.length;for(c=0;c<f;c+=1)h[c]=str(c,i)||"null";e=h.length===0?"[]":gap?"[\n"+gap+h.join(",\n"+gap)+"\n"+g+"]":"["+h.join(",")+"]",gap=g;return e}if(rep&&typeof rep=="object"){f=rep.length;for(c=0;c<f;c+=1)typeof rep[c]=="string"&&(d=rep[c],e=str(d,i),e&&h.push(quote(d)+(gap?": ":":")+e))}else for(d in i)Object.prototype.hasOwnProperty.call(i,d)&&(e=str(d,i),e&&h.push(quote(d)+(gap?": ":":")+e));e=h.length===0?"{}":gap?"{\n"+gap+h.join(",\n"+gap)+"\n"+g+"}":"{"+h.join(",")+"}",gap=g;return e}}function quote(a){escapable.lastIndex=0;return escapable.test(a)?'"'+a.replace(escapable,function(a){var b=meta[a];return typeof b=="string"?b:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function f(a){return a<10?"0"+a:a}"use strict",typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(a){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(a){return this.valueOf()});var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;typeof JSON.stringify!="function"&&(JSON.stringify=function(a,b,c){var d;gap="",indent="";if(typeof c=="number")for(d=0;d<c;d+=1)indent+=" ";else typeof c=="string"&&(indent=c);rep=b;if(!b||typeof b=="function"||typeof b=="object"&&typeof b.length=="number")return str("",{"":a});throw new Error("JSON.stringify")}),typeof JSON.parse!="function"&&(JSON.parse=function(text,reviver){function walk(a,b){var c,d,e=a[b];if(e&&typeof e=="object")for(c in e)Object.prototype.hasOwnProperty.call(e,c)&&(d=walk(e,c),d!==undefined?e[c]=d:delete e[c]);return reviver.call(a,b,e)}var j;text=String(text),cx.lastIndex=0,cx.test(text)&&(text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver=="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")})}()


//     [*] Including lib/index.js
// Public object
var SockJS = (function(){
              var _document = document;
              var _window = window;
              var utils = {};


//         [*] Including lib/reventtarget.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

/* Simplified implementation of DOM2 EventTarget.
 *   http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget
 */
var REventTarget = function() {};
REventTarget.prototype.addEventListener = function (eventType, listener) {
    if(!this._listeners) {
         this._listeners = {};
    }
    if(!(eventType in this._listeners)) {
        this._listeners[eventType] = [];
    }
    var arr = this._listeners[eventType];
    if(utils.arrIndexOf(arr, listener) === -1) {
        arr.push(listener);
    }
    return;
};

REventTarget.prototype.removeEventListener = function (eventType, listener) {
    if(!(this._listeners && (eventType in this._listeners))) {
        return;
    }
    var arr = this._listeners[eventType];
    var idx = utils.arrIndexOf(arr, listener);
    if (idx !== -1) {
        if(arr.length > 1) {
            this._listeners[eventType] = arr.slice(0, idx).concat( arr.slice(idx+1) );
        } else {
            delete this._listeners[eventType];
        }
        return;
    }
    return;
};

REventTarget.prototype.dispatchEvent = function (event) {
    var t = event.type;
    var args = Array.prototype.slice.call(arguments, 0);
    if (this['on'+t]) {
        this['on'+t].apply(this, args);
    }
    if (this._listeners && t in this._listeners) {
        for(var i=0; i < this._listeners[t].length; i++) {
            this._listeners[t][i].apply(this, args);
        }
    }
};
//         [*] End of lib/reventtarget.js


//         [*] Including lib/simpleevent.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var SimpleEvent = function(type, obj) {
    this.type = type;
    if (typeof obj !== 'undefined') {
        for(var k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            this[k] = obj[k];
        }
    }
};

SimpleEvent.prototype.toString = function() {
    var r = [];
    for(var k in this) {
        if (!this.hasOwnProperty(k)) continue;
        var v = this[k];
        if (typeof v === 'function') v = '[function]';
        r.push(k + '=' + v);
    }
    return 'SimpleEvent(' + r.join(', ') + ')';
};
//         [*] End of lib/simpleevent.js


//         [*] Including lib/eventemitter.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventEmitter = function(events) {
    this.events = events || [];
};
EventEmitter.prototype.emit = function(type) {
    var that = this;
    var args = Array.prototype.slice.call(arguments, 1);
    if (!that.nuked && that['on'+type]) {
        that['on'+type].apply(that, args);
    }
    if (utils.arrIndexOf(that.events, type) === -1) {
        utils.log('Event ' + JSON.stringify(type) +
                  ' not listed ' + JSON.stringify(that.events) +
                  ' in ' + that);
    }
};

EventEmitter.prototype.nuke = function(type) {
    var that = this;
    that.nuked = true;
    for(var i=0; i<that.events.length; i++) {
        delete that[that.events[i]];
    }
};
//         [*] End of lib/eventemitter.js


//         [*] Including lib/utils.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var random_string_chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
utils.random_string = function(length, max) {
    max = max || random_string_chars.length;
    var i, ret = [];
    for(i=0; i < length; i++) {
        ret.push( random_string_chars.substr(Math.floor(Math.random() * max),1) );
    }
    return ret.join('');
};
utils.random_number = function(max) {
    return Math.floor(Math.random() * max);
};
utils.random_number_string = function(max) {
    var t = (''+(max - 1)).length;
    var p = Array(t+1).join('0');
    return (p + utils.random_number(max)).slice(-t);
};

// Assuming that url looks like: http://asdasd:111/asd
utils.getOrigin = function(url) {
    url += '/';
    var parts = url.split('/').slice(0, 3);
    return parts.join('/');
};

utils.isSameOriginUrl = function(url_a, url_b) {
    // location.origin would do, but it's not always available.
    if (!url_b) url_b = _window.location.href;

    return (url_a.split('/').slice(0,3).join('/')
                ===
            url_b.split('/').slice(0,3).join('/'));
};

utils.getParentDomain = function(url) {
    // ipv4 ip address
    if (/^[0-9.]*$/.test(url)) return url;
    // ipv6 ip address
    if (/^\[/.test(url)) return url;
    // no dots
    if (!(/[.]/.test(url))) return url;

    var parts = url.split('.').slice(1);
    return parts.join('.');
};

utils.objectExtend = function(dst, src) {
    for(var k in src) {
        if (src.hasOwnProperty(k)) {
            dst[k] = src[k];
        }
    }
    return dst;
};

var WPrefix = '_jp';

utils.polluteGlobalNamespace = function() {
    if (!(WPrefix in _window)) {
        _window[WPrefix] = {};
    }
};

utils.closeFrame = function (code, reason) {
    return 'c'+JSON.stringify([code, reason]);
};

utils.userSetCode = function (code) {
    return code === 1000 || (code >= 3000 && code <= 4999);
};

// See: http://www.erg.abdn.ac.uk/~gerrit/dccp/notes/ccid2/rto_estimator/
// and RFC 2988.
utils.countRTO = function (rtt) {
    var rto;
    if (rtt > 100) {
        rto = 3 * rtt; // rto > 300msec
    } else {
        rto = rtt + 200; // 200msec < rto <= 300msec
    }
    return rto;
}

utils.log = function() {
    if (_window.console && console.log && console.log.apply) {
        console.log.apply(console, arguments);
    }
};

utils.bind = function(fun, that) {
    if (fun.bind) {
        return fun.bind(that);
    } else {
        return function() {
            return fun.apply(that, arguments);
        };
    }
};

utils.flatUrl = function(url) {
    return url.indexOf('?') === -1 && url.indexOf('#') === -1;
};

utils.amendUrl = function(url) {
    var dl = _document.location;
    if (!url) {
        throw new Error('Wrong url for SockJS');
    }
    if (!utils.flatUrl(url)) {
        throw new Error('Only basic urls are supported in SockJS');
    }

    //  '//abc' --> 'http://abc'
    if (url.indexOf('//') === 0) {
        url = dl.protocol + url;
    }
    // '/abc' --> 'http://localhost:80/abc'
    if (url.indexOf('/') === 0) {
        url = dl.protocol + '//' + dl.host + url;
    }
    // strip trailing slashes
    url = url.replace(/[/]+$/,'');
    return url;
};

// IE doesn't support [].indexOf.
utils.arrIndexOf = function(arr, obj){
    for(var i=0; i < arr.length; i++){
        if(arr[i] === obj){
            return i;
        }
    }
    return -1;
};

utils.arrSkip = function(arr, obj) {
    var idx = utils.arrIndexOf(arr, obj);
    if (idx === -1) {
        return arr.slice();
    } else {
        var dst = arr.slice(0, idx);
        return dst.concat(arr.slice(idx+1));
    }
};

// Via: https://gist.github.com/1133122/2121c601c5549155483f50be3da5305e83b8c5df
utils.isArray = Array.isArray || function(value) {
    return {}.toString.call(value).indexOf('Array') >= 0
};

utils.delay = function(t, fun) {
    if(typeof t === 'function') {
        fun = t;
        t = 0;
    }
    return setTimeout(fun, t);
};


// Chars worth escaping, as defined by Douglas Crockford:
//   https://github.com/douglascrockford/JSON-js/blob/47a9882cddeb1e8529e07af9736218075372b8ac/json2.js#L196
var json_escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    json_lookup = {
"\u0000":"\\u0000","\u0001":"\\u0001","\u0002":"\\u0002","\u0003":"\\u0003",
"\u0004":"\\u0004","\u0005":"\\u0005","\u0006":"\\u0006","\u0007":"\\u0007",
"\b":"\\b","\t":"\\t","\n":"\\n","\u000b":"\\u000b","\f":"\\f","\r":"\\r",
"\u000e":"\\u000e","\u000f":"\\u000f","\u0010":"\\u0010","\u0011":"\\u0011",
"\u0012":"\\u0012","\u0013":"\\u0013","\u0014":"\\u0014","\u0015":"\\u0015",
"\u0016":"\\u0016","\u0017":"\\u0017","\u0018":"\\u0018","\u0019":"\\u0019",
"\u001a":"\\u001a","\u001b":"\\u001b","\u001c":"\\u001c","\u001d":"\\u001d",
"\u001e":"\\u001e","\u001f":"\\u001f","\"":"\\\"","\\":"\\\\",
"\u007f":"\\u007f","\u0080":"\\u0080","\u0081":"\\u0081","\u0082":"\\u0082",
"\u0083":"\\u0083","\u0084":"\\u0084","\u0085":"\\u0085","\u0086":"\\u0086",
"\u0087":"\\u0087","\u0088":"\\u0088","\u0089":"\\u0089","\u008a":"\\u008a",
"\u008b":"\\u008b","\u008c":"\\u008c","\u008d":"\\u008d","\u008e":"\\u008e",
"\u008f":"\\u008f","\u0090":"\\u0090","\u0091":"\\u0091","\u0092":"\\u0092",
"\u0093":"\\u0093","\u0094":"\\u0094","\u0095":"\\u0095","\u0096":"\\u0096",
"\u0097":"\\u0097","\u0098":"\\u0098","\u0099":"\\u0099","\u009a":"\\u009a",
"\u009b":"\\u009b","\u009c":"\\u009c","\u009d":"\\u009d","\u009e":"\\u009e",
"\u009f":"\\u009f","\u00ad":"\\u00ad","\u0600":"\\u0600","\u0601":"\\u0601",
"\u0602":"\\u0602","\u0603":"\\u0603","\u0604":"\\u0604","\u070f":"\\u070f",
"\u17b4":"\\u17b4","\u17b5":"\\u17b5","\u200c":"\\u200c","\u200d":"\\u200d",
"\u200e":"\\u200e","\u200f":"\\u200f","\u2028":"\\u2028","\u2029":"\\u2029",
"\u202a":"\\u202a","\u202b":"\\u202b","\u202c":"\\u202c","\u202d":"\\u202d",
"\u202e":"\\u202e","\u202f":"\\u202f","\u2060":"\\u2060","\u2061":"\\u2061",
"\u2062":"\\u2062","\u2063":"\\u2063","\u2064":"\\u2064","\u2065":"\\u2065",
"\u2066":"\\u2066","\u2067":"\\u2067","\u2068":"\\u2068","\u2069":"\\u2069",
"\u206a":"\\u206a","\u206b":"\\u206b","\u206c":"\\u206c","\u206d":"\\u206d",
"\u206e":"\\u206e","\u206f":"\\u206f","\ufeff":"\\ufeff","\ufff0":"\\ufff0",
"\ufff1":"\\ufff1","\ufff2":"\\ufff2","\ufff3":"\\ufff3","\ufff4":"\\ufff4",
"\ufff5":"\\ufff5","\ufff6":"\\ufff6","\ufff7":"\\ufff7","\ufff8":"\\ufff8",
"\ufff9":"\\ufff9","\ufffa":"\\ufffa","\ufffb":"\\ufffb","\ufffc":"\\ufffc",
"\ufffd":"\\ufffd","\ufffe":"\\ufffe","\uffff":"\\uffff"};

// Some extra characters that Chrome gets wrong, and substitutes with
// something else on the wire.
var extra_escapable = /[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g,
    extra_lookup;

// JSON Quote string. Use native implementation when possible.
var JSONQuote = (JSON && JSON.stringify) || function(string) {
    json_escapable.lastIndex = 0;
    if (json_escapable.test(string)) {
        string = string.replace(json_escapable, function(a) {
            return json_lookup[a];
        });
    }
    return '"' + string + '"';
};

// This may be quite slow, so let's delay until user actually uses bad
// characters.
var unroll_lookup = function(escapable) {
    var i;
    var unrolled = {}
    var c = []
    for(i=0; i<65536; i++) {
        c.push( String.fromCharCode(i) );
    }
    escapable.lastIndex = 0;
    c.join('').replace(escapable, function (a) {
        unrolled[ a ] = '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        return '';
    });
    escapable.lastIndex = 0;
    return unrolled;
};

// Quote string, also taking care of unicode characters that browsers
// often break. Especially, take care of unicode surrogates:
//    http://en.wikipedia.org/wiki/Mapping_of_Unicode_characters#Surrogates
utils.quote = function(string) {
    var quoted = JSONQuote(string);

    // In most cases this should be very fast and good enough.
    extra_escapable.lastIndex = 0;
    if(!extra_escapable.test(quoted)) {
        return quoted;
    }

    if(!extra_lookup) extra_lookup = unroll_lookup(extra_escapable);

    return quoted.replace(extra_escapable, function(a) {
        return extra_lookup[a];
    });
}

var _all_protocols = ['websocket',
                      'xdr-streaming',
                      'xhr-streaming',
                      'iframe-eventsource',
                      'iframe-htmlfile',
                      'xdr-polling',
                      'xhr-polling',
                      'iframe-xhr-polling',
                      'jsonp-polling'];

utils.probeProtocols = function() {
    var probed = {};
    for(var i=0; i<_all_protocols.length; i++) {
        var protocol = _all_protocols[i];
        // User can have a typo in protocol name.
        probed[protocol] = SockJS[protocol] &&
                           SockJS[protocol].enabled();
    }
    return probed;
};

utils.detectProtocols = function(probed, protocols_whitelist, info) {
    var pe = {},
        protocols = [];
    if (!protocols_whitelist) protocols_whitelist = _all_protocols;
    for(var i=0; i<protocols_whitelist.length; i++) {
        var protocol = protocols_whitelist[i];
        pe[protocol] = probed[protocol];
    }
    var maybe_push = function(protos) {
        var proto = protos.shift();
        if (pe[proto]) {
            protocols.push(proto);
        } else {
            if (protos.length > 0) {
                maybe_push(protos);
            }
        }
    }

    // 1. Websocket
    if (info.websocket !== false) {
        maybe_push(['websocket']);
    }

    // 2. Streaming
    if (pe['xhr-streaming'] && !info.null_origin) {
        protocols.push('xhr-streaming');
    } else {
        if (pe['xdr-streaming'] && !info.cookie_needed && !info.null_origin) {
            protocols.push('xdr-streaming');
        } else {
            maybe_push(['iframe-eventsource',
                        'iframe-htmlfile']);
        }
    }

    // 3. Polling
    if (pe['xhr-polling'] && !info.null_origin) {
        protocols.push('xhr-polling');
    } else {
        if (pe['xdr-polling'] && !info.cookie_needed && !info.null_origin) {
            protocols.push('xdr-polling');
        } else {
            maybe_push(['iframe-xhr-polling',
                        'jsonp-polling']);
        }
    }
    return protocols;
}
//         [*] End of lib/utils.js


//         [*] Including lib/dom.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// May be used by htmlfile jsonp and transports.
var MPrefix = '_sockjs_global';
utils.createHook = function() {
    var window_id = 'a' + utils.random_string(8);
    if (!(MPrefix in _window)) {
        var map = {};
        _window[MPrefix] = function(window_id) {
            if (!(window_id in map)) {
                map[window_id] = {
                    id: window_id,
                    del: function() {delete map[window_id];}
                };
            }
            return map[window_id];
        }
    }
    return _window[MPrefix](window_id);
};



utils.attachMessage = function(listener) {
    utils.attachEvent('message', listener);
};
utils.attachEvent = function(event, listener) {
    if (typeof _window.addEventListener !== 'undefined') {
        _window.addEventListener(event, listener, false);
    } else {
        // IE quirks.
        // According to: http://stevesouders.com/misc/test-postmessage.php
        // the message gets delivered only to 'document', not 'window'.
        _document.attachEvent("on" + event, listener);
        // I get 'window' for ie8.
        _window.attachEvent("on" + event, listener);
    }
};

utils.detachMessage = function(listener) {
    utils.detachEvent('message', listener);
};
utils.detachEvent = function(event, listener) {
    if (typeof _window.addEventListener !== 'undefined') {
        _window.removeEventListener(event, listener, false);
    } else {
        _document.detachEvent("on" + event, listener);
        _window.detachEvent("on" + event, listener);
    }
};


var on_unload = {};
// Things registered after beforeunload are to be called immediately.
var after_unload = false;

var trigger_unload_callbacks = function() {
    for(var ref in on_unload) {
        on_unload[ref]();
        delete on_unload[ref];
    };
};

var unload_triggered = function() {
    if(after_unload) return;
    after_unload = true;
    trigger_unload_callbacks();
};

// Onbeforeunload alone is not reliable. We could use only 'unload'
// but it's not working in opera within an iframe. Let's use both.
utils.attachEvent('beforeunload', unload_triggered);
utils.attachEvent('unload', unload_triggered);

utils.unload_add = function(listener) {
    var ref = utils.random_string(8);
    on_unload[ref] = listener;
    if (after_unload) {
        utils.delay(trigger_unload_callbacks);
    }
    return ref;
};
utils.unload_del = function(ref) {
    if (ref in on_unload)
        delete on_unload[ref];
};


utils.createIframe = function (iframe_url, error_callback) {
    var iframe = _document.createElement('iframe');
    var tref, unload_ref;
    var unattach = function() {
        clearTimeout(tref);
        // Explorer had problems with that.
        try {iframe.onload = null;} catch (x) {}
        iframe.onerror = null;
    };
    var cleanup = function() {
        if (iframe) {
            unattach();
            // This timeout makes chrome fire onbeforeunload event
            // within iframe. Without the timeout it goes straight to
            // onunload.
            setTimeout(function() {
                if(iframe) {
                    iframe.parentNode.removeChild(iframe);
                }
                iframe = null;
            }, 0);
            utils.unload_del(unload_ref);
        }
    };
    var onerror = function(r) {
        if (iframe) {
            cleanup();
            error_callback(r);
        }
    };
    var post = function(msg, origin) {
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
            }
        } catch (x) {};
    };

    iframe.src = iframe_url;
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.onerror = function(){onerror('onerror');};
    iframe.onload = function() {
        // `onload` is triggered before scripts on the iframe are
        // executed. Give it few seconds to actually load stuff.
        clearTimeout(tref);
        tref = setTimeout(function(){onerror('onload timeout');}, 2000);
    };
    _document.body.appendChild(iframe);
    tref = setTimeout(function(){onerror('timeout');}, 15000);
    unload_ref = utils.unload_add(cleanup);
    return {
        post: post,
        cleanup: cleanup,
        loaded: unattach
    };
};

utils.createHtmlfile = function (iframe_url, error_callback) {
    var doc = new ActiveXObject('htmlfile');
    var tref, unload_ref;
    var iframe;
    var unattach = function() {
        clearTimeout(tref);
    };
    var cleanup = function() {
        if (doc) {
            unattach();
            utils.unload_del(unload_ref);
            iframe.parentNode.removeChild(iframe);
            iframe = doc = null;
            CollectGarbage();
        }
    };
    var onerror = function(r)  {
        if (doc) {
            cleanup();
            error_callback(r);
        }
    };
    var post = function(msg, origin) {
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
            }
        } catch (x) {};
    };

    doc.open();
    doc.write('<html><s' + 'cript>' +
              'document.domain="' + document.domain + '";' +
              '</s' + 'cript></html>');
    doc.close();
    doc.parentWindow[WPrefix] = _window[WPrefix];
    var c = doc.createElement('div');
    doc.body.appendChild(c);
    iframe = doc.createElement('iframe');
    c.appendChild(iframe);
    iframe.src = iframe_url;
    tref = setTimeout(function(){onerror('timeout');}, 15000);
    unload_ref = utils.unload_add(cleanup);
    return {
        post: post,
        cleanup: cleanup,
        loaded: unattach
    };
};
//         [*] End of lib/dom.js


//         [*] Including lib/dom2.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var AbstractXHRObject = function(){};
AbstractXHRObject.prototype = new EventEmitter(['chunk', 'finish']);

AbstractXHRObject.prototype._start = function(method, url, payload, opts) {
    var that = this;

    try {
        that.xhr = new XMLHttpRequest();
    } catch(x) {};

    if (!that.xhr) {
        try {
            that.xhr = new _window.ActiveXObject('Microsoft.XMLHTTP');
        } catch(x) {};
    }
    if (_window.ActiveXObject || _window.XDomainRequest) {
        // IE8 caches even POSTs
        url += ((url.indexOf('?') === -1) ? '?' : '&') + 't='+(+new Date);
    }

    // Explorer tends to keep connection open, even after the
    // tab gets closed: http://bugs.jquery.com/ticket/5280
    that.unload_ref = utils.unload_add(function(){that._cleanup(true);});
    try {
        that.xhr.open(method, url, true);
    } catch(e) {
        // IE raises an exception on wrong port.
        that.emit('finish', 0, '');
        that._cleanup();
        return;
    };

    if (!opts || !opts.no_credentials) {
        // Mozilla docs says https://developer.mozilla.org/en/XMLHttpRequest :
        // "This never affects same-site requests."
        that.xhr.withCredentials = 'true';
    }
    if (opts && opts.headers) {
        for(var key in opts.headers) {
            that.xhr.setRequestHeader(key, opts.headers[key]);
        }
    }

    that.xhr.onreadystatechange = function() {
        if (that.xhr) {
            var x = that.xhr;
            switch (x.readyState) {
            case 3:
                // IE doesn't like peeking into responseText or status
                // on Microsoft.XMLHTTP and readystate=3
                try {
                    var status = x.status;
                    var text = x.responseText;
                } catch (x) {};
                // IE does return readystate == 3 for 404 answers.
                if (text && text.length > 0) {
                    that.emit('chunk', status, text);
                }
                break;
            case 4:
                that.emit('finish', x.status, x.responseText);
                that._cleanup(false);
                break;
            }
        }
    };
    that.xhr.send(payload);
};

AbstractXHRObject.prototype._cleanup = function(abort) {
    var that = this;
    if (!that.xhr) return;
    utils.unload_del(that.unload_ref);

    // IE needs this field to be a function
    that.xhr.onreadystatechange = function(){};

    if (abort) {
        try {
            that.xhr.abort();
        } catch(x) {};
    }
    that.unload_ref = that.xhr = null;
};

AbstractXHRObject.prototype.close = function() {
    var that = this;
    that.nuke();
    that._cleanup(true);
};

var XHRCorsObject = utils.XHRCorsObject = function() {
    var that = this, args = arguments;
    utils.delay(function(){that._start.apply(that, args);});
};
XHRCorsObject.prototype = new AbstractXHRObject();

var XHRLocalObject = utils.XHRLocalObject = function(method, url, payload) {
    var that = this;
    utils.delay(function(){
        that._start(method, url, payload, {
            no_credentials: true
        });
    });
};
XHRLocalObject.prototype = new AbstractXHRObject();



// References:
//   http://ajaxian.com/archives/100-line-ajax-wrapper
//   http://msdn.microsoft.com/en-us/library/cc288060(v=VS.85).aspx
var XDRObject = utils.XDRObject = function(method, url, payload) {
    var that = this;
    utils.delay(function(){that._start(method, url, payload);});
};
XDRObject.prototype = new EventEmitter(['chunk', 'finish']);
XDRObject.prototype._start = function(method, url, payload) {
    var that = this;
    var xdr = new XDomainRequest();
    // IE caches even POSTs
    url += ((url.indexOf('?') === -1) ? '?' : '&') + 't='+(+new Date);

    var onerror = xdr.ontimeout = xdr.onerror = function() {
        that.emit('finish', 0, '');
        that._cleanup(false);
    };
    xdr.onprogress = function() {
        that.emit('chunk', 200, xdr.responseText);
    };
    xdr.onload = function() {
        that.emit('finish', 200, xdr.responseText);
        that._cleanup(false);
    };
    that.xdr = xdr;
    that.unload_ref = utils.unload_add(function(){that._cleanup(true);});
    try {
        // Fails with AccessDenied if port number is bogus
        that.xdr.open(method, url);
        that.xdr.send(payload);
    } catch(x) {
        onerror();
    }
};

XDRObject.prototype._cleanup = function(abort) {
    var that = this;
    if (!that.xdr) return;
    utils.unload_del(that.unload_ref);

    that.xdr.ontimeout = that.xdr.onerror = that.xdr.onprogress =
        that.xdr.onload = null;
    if (abort) {
        try {
            that.xdr.abort();
        } catch(x) {};
    }
    that.unload_ref = that.xdr = null;
};

XDRObject.prototype.close = function() {
    var that = this;
    that.nuke();
    that._cleanup(true);
};

// 1. Is natively via XHR
// 2. Is natively via XDR
// 3. Nope, but postMessage is there so it should work via the Iframe.
// 4. Nope, sorry.
utils.isXHRCorsCapable = function() {
    if (_window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest()) {
        return 1;
    }
    // XDomainRequest doesn't work if page is served from file://
    if (_window.XDomainRequest && _document.domain) {
        return 2;
    }
    if (IframeTransport.enabled()) {
        return 3;
    }
    return 4;
};
//         [*] End of lib/dom2.js


//         [*] Including lib/sockjs.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var SockJS = function(url, dep_protocols_whitelist, options) {
    if (this === window) {
        // makes `new` optional
        return new SockJS(url, dep_protocols_whitelist, options);
    }
    
    var that = this, protocols_whitelist;
    that._options = {devel: false, debug: false, protocols_whitelist: [],
                     info: undefined, rtt: undefined};
    if (options) {
        utils.objectExtend(that._options, options);
    }
    that._base_url = utils.amendUrl(url);
    that._server = that._options.server || utils.random_number_string(1000);
    if (that._options.protocols_whitelist &&
        that._options.protocols_whitelist.length) {
        protocols_whitelist = that._options.protocols_whitelist;
    } else {
        // Deprecated API
        if (typeof dep_protocols_whitelist === 'string' &&
            dep_protocols_whitelist.length > 0) {
            protocols_whitelist = [dep_protocols_whitelist];
        } else if (utils.isArray(dep_protocols_whitelist)) {
            protocols_whitelist = dep_protocols_whitelist
        } else {
            protocols_whitelist = null;
        }
        if (protocols_whitelist) {
            that._debug('Deprecated API: Use "protocols_whitelist" option ' +
                        'instead of supplying protocol list as a second ' +
                        'parameter to SockJS constructor.');
        }
    }
    that._protocols = [];
    that.protocol = null;
    that.readyState = SockJS.CONNECTING;
    that._ir = createInfoReceiver(that._base_url);
    that._ir.onfinish = function(info, rtt) {
        that._ir = null;
        if (info) {
            if (that._options.info) {
                // Override if user supplies the option
                info = utils.objectExtend(info, that._options.info);
            }
            if (that._options.rtt) {
                rtt = that._options.rtt;
            }
            that._applyInfo(info, rtt, protocols_whitelist);
            that._didClose();
        } else {
            that._didClose(1002, 'Can\'t connect to server', true);
        }
    };
};
// Inheritance
SockJS.prototype = new REventTarget();

SockJS.version = "0.3.1.7.ga67f.dirty";

SockJS.CONNECTING = 0;
SockJS.OPEN = 1;
SockJS.CLOSING = 2;
SockJS.CLOSED = 3;

SockJS.prototype._debug = function() {
    if (this._options.debug)
        utils.log.apply(utils, arguments);
};

SockJS.prototype._dispatchOpen = function() {
    var that = this;
    if (that.readyState === SockJS.CONNECTING) {
        if (that._transport_tref) {
            clearTimeout(that._transport_tref);
            that._transport_tref = null;
        }
        that.readyState = SockJS.OPEN;
        that.dispatchEvent(new SimpleEvent("open"));
    } else {
        // The server might have been restarted, and lost track of our
        // connection.
        that._didClose(1006, "Server lost session");
    }
};

SockJS.prototype._dispatchMessage = function(data) {
    var that = this;
    if (that.readyState !== SockJS.OPEN)
            return;
    that.dispatchEvent(new SimpleEvent("message", {data: data}));
};

SockJS.prototype._dispatchHeartbeat = function(data) {
    var that = this;
    if (that.readyState !== SockJS.OPEN)
        return;
    that.dispatchEvent(new SimpleEvent('heartbeat', {}));
};

SockJS.prototype._didClose = function(code, reason, force) {
    var that = this;
    if (that.readyState !== SockJS.CONNECTING &&
        that.readyState !== SockJS.OPEN &&
        that.readyState !== SockJS.CLOSING)
            throw new Error('INVALID_STATE_ERR');
    if (that._ir) {
        that._ir.nuke();
        that._ir = null;
    }

    if (that._transport) {
        that._transport.doCleanup();
        that._transport = null;
    }

    var close_event = new SimpleEvent("close", {
        code: code,
        reason: reason,
        wasClean: utils.userSetCode(code)});

    if (!utils.userSetCode(code) &&
        that.readyState === SockJS.CONNECTING && !force) {
        if (that._try_next_protocol(close_event)) {
            return;
        }
        close_event = new SimpleEvent("close", {code: 2000,
                                                reason: "All transports failed",
                                                wasClean: false,
                                                last_event: close_event});
    }
    that.readyState = SockJS.CLOSED;

    utils.delay(function() {
                   that.dispatchEvent(close_event);
                });
};

SockJS.prototype._didMessage = function(data) {
    var that = this;
    var type = data.slice(0, 1);
    switch(type) {
    case 'o':
        that._dispatchOpen();
        break;
    case 'a':
        var payload = JSON.parse(data.slice(1) || '[]');
        for(var i=0; i < payload.length; i++){
            that._dispatchMessage(payload[i]);
        }
        break;
    case 'm':
        var payload = JSON.parse(data.slice(1) || 'null');
        that._dispatchMessage(payload);
        break;
    case 'c':
        var payload = JSON.parse(data.slice(1) || '[]');
        that._didClose(payload[0], payload[1]);
        break;
    case 'h':
        that._dispatchHeartbeat();
        break;
    }
};

SockJS.prototype._try_next_protocol = function(close_event) {
    var that = this;
    if (that.protocol) {
        that._debug('Closed transport:', that.protocol, ''+close_event);
        that.protocol = null;
    }
    if (that._transport_tref) {
        clearTimeout(that._transport_tref);
        that._transport_tref = null;
    }

    while(1) {
        var protocol = that.protocol = that._protocols.shift();
        if (!protocol) {
            return false;
        }
        // Some protocols require access to `body`, what if were in
        // the `head`?
        if (SockJS[protocol] &&
            SockJS[protocol].need_body === true &&
            (!_document.body ||
             (typeof _document.readyState !== 'undefined'
              && _document.readyState !== 'complete'))) {
            that._protocols.unshift(protocol);
            that.protocol = 'waiting-for-load';
            utils.attachEvent('load', function(){
                that._try_next_protocol();
            });
            return true;
        }

        if (!SockJS[protocol] ||
              !SockJS[protocol].enabled(that._options)) {
            that._debug('Skipping transport:', protocol);
        } else {
            var roundTrips = SockJS[protocol].roundTrips || 1;
            var to = ((that._options.rto || 0) * roundTrips) || 5000;
            that._transport_tref = utils.delay(to, function() {
                if (that.readyState === SockJS.CONNECTING) {
                    // I can't understand how it is possible to run
                    // this timer, when the state is CLOSED, but
                    // apparently in IE everythin is possible.
                    that._didClose(2007, "Transport timeouted");
                }
            });

            var connid = utils.random_string(8);
            var trans_url = that._base_url + '/' + that._server + '/' + connid;
            that._debug('Opening transport:', protocol, ' url:'+trans_url,
                        ' RTO:'+that._options.rto);
            that._transport = new SockJS[protocol](that, trans_url,
                                                   that._base_url);
            return true;
        }
    }
};

SockJS.prototype.close = function(code, reason) {
    var that = this;
    if (code && !utils.userSetCode(code))
        throw new Error("INVALID_ACCESS_ERR");
    if(that.readyState !== SockJS.CONNECTING &&
       that.readyState !== SockJS.OPEN) {
        return false;
    }
    that.readyState = SockJS.CLOSING;
    that._didClose(code || 1000, reason || "Normal closure");
    return true;
};

SockJS.prototype.send = function(data) {
    var that = this;
    if (that.readyState === SockJS.CONNECTING)
        throw new Error('INVALID_STATE_ERR');
    if (that.readyState === SockJS.OPEN) {
        that._transport.doSend(utils.quote('' + data));
    }
    return true;
};

SockJS.prototype._applyInfo = function(info, rtt, protocols_whitelist) {
    var that = this;
    that._options.info = info;
    that._options.rtt = rtt;
    that._options.rto = utils.countRTO(rtt);
    that._options.info.null_origin = !_document.domain;
    var probed = utils.probeProtocols();
    that._protocols = utils.detectProtocols(probed, protocols_whitelist, info);
};
//         [*] End of lib/sockjs.js


//         [*] Including lib/trans-websocket.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var WebSocketTransport = SockJS.websocket = function(ri, trans_url) {
    var that = this;
    var url = trans_url + '/websocket';
    if (url.slice(0, 5) === 'https') {
        url = 'wss' + url.slice(5);
    } else {
        url = 'ws' + url.slice(4);
    }
    that.ri = ri;
    that.url = url;
    var Constructor = _window.WebSocket || _window.MozWebSocket;

    that.ws = new Constructor(that.url);
    that.ws.onmessage = function(e) {
        that.ri._didMessage(e.data);
    };
    // Firefox has an interesting bug. If a websocket connection is
    // created after onbeforeunload, it stays alive even when user
    // navigates away from the page. In such situation let's lie -
    // let's not open the ws connection at all. See:
    // https://github.com/sockjs/sockjs-client/issues/28
    // https://bugzilla.mozilla.org/show_bug.cgi?id=696085
    that.unload_ref = utils.unload_add(function(){that.ws.close()});
    that.ws.onclose = function() {
        that.ri._didMessage(utils.closeFrame(1006, "WebSocket connection broken"));
    };
};

WebSocketTransport.prototype.doSend = function(data) {
    this.ws.send('[' + data + ']');
};

WebSocketTransport.prototype.doCleanup = function() {
    var that = this;
    var ws = that.ws;
    if (ws) {
        ws.onmessage = ws.onclose = null;
        ws.close();
        utils.unload_del(that.unload_ref);
        that.unload_ref = that.ri = that.ws = null;
    }
};

WebSocketTransport.enabled = function() {
    return !!(_window.WebSocket || _window.MozWebSocket);
};

// In theory, ws should require 1 round trip. But in chrome, this is
// not very stable over SSL. Most likely a ws connection requires a
// separate SSL connection, in which case 2 round trips are an
// absolute minumum.
WebSocketTransport.roundTrips = 2;
//         [*] End of lib/trans-websocket.js


//         [*] Including lib/trans-sender.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var BufferedSender = function() {};
BufferedSender.prototype.send_constructor = function(sender) {
    var that = this;
    that.send_buffer = [];
    that.sender = sender;
};
BufferedSender.prototype.doSend = function(message) {
    var that = this;
    that.send_buffer.push(message);
    if (!that.send_stop) {
        that.send_schedule();
    }
};

// For polling transports in a situation when in the message callback,
// new message is being send. If the sending connection was started
// before receiving one, it is possible to saturate the network and
// timeout due to the lack of receiving socket. To avoid that we delay
// sending messages by some small time, in order to let receiving
// connection be started beforehand. This is only a halfmeasure and
// does not fix the big problem, but it does make the tests go more
// stable on slow networks.
BufferedSender.prototype.send_schedule_wait = function() {
    var that = this;
    var tref;
    that.send_stop = function() {
        that.send_stop = null;
        clearTimeout(tref);
    };
    tref = utils.delay(25, function() {
        that.send_stop = null;
        that.send_schedule();
    });
};

BufferedSender.prototype.send_schedule = function() {
    var that = this;
    if (that.send_buffer.length > 0) {
        var payload = '[' + that.send_buffer.join(',') + ']';
        that.send_stop = that.sender(that.trans_url,
                                     payload,
                                     function() {
                                         that.send_stop = null;
                                         that.send_schedule_wait();
                                     });
        that.send_buffer = [];
    }
};

BufferedSender.prototype.send_destructor = function() {
    var that = this;
    if (that._send_stop) {
        that._send_stop();
    }
    that._send_stop = null;
};

var jsonPGenericSender = function(url, payload, callback) {
    var that = this;

    if (!('_send_form' in that)) {
        var form = that._send_form = _document.createElement('form');
        var area = that._send_area = _document.createElement('textarea');
        area.name = 'd';
        form.style.display = 'none';
        form.style.position = 'absolute';
        form.method = 'POST';
        form.enctype = 'application/x-www-form-urlencoded';
        form.acceptCharset = "UTF-8";
        form.appendChild(area);
        _document.body.appendChild(form);
    }
    var form = that._send_form;
    var area = that._send_area;
    var id = 'a' + utils.random_string(8);
    form.target = id;
    form.action = url + '/jsonp_send?i=' + id;

    var iframe;
    try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        iframe = _document.createElement('<iframe name="'+ id +'">');
    } catch(x) {
        iframe = _document.createElement('iframe');
        iframe.name = id;
    }
    iframe.id = id;
    form.appendChild(iframe);
    iframe.style.display = 'none';

    try {
        area.value = payload;
    } catch(e) {
        utils.log('Your browser is seriously broken. Go home! ' + e.message);
    }
    form.submit();

    var completed = function(e) {
        if (!iframe.onerror) return;
        iframe.onreadystatechange = iframe.onerror = iframe.onload = null;
        // Opera mini doesn't like if we GC iframe
        // immediately, thus this timeout.
        utils.delay(500, function() {
                       iframe.parentNode.removeChild(iframe);
                       iframe = null;
                   });
        area.value = '';
        callback();
    };
    iframe.onerror = iframe.onload = completed;
    iframe.onreadystatechange = function(e) {
        if (iframe.readyState == 'complete') completed();
    };
    return completed;
};

var createAjaxSender = function(AjaxObject) {
    return function(url, payload, callback) {
        var xo = new AjaxObject('POST', url + '/xhr_send', payload);
        xo.onfinish = function(status, text) {
            callback(status);
        };
        return function(abort_reason) {
            callback(0, abort_reason);
        };
    };
};
//         [*] End of lib/trans-sender.js


//         [*] Including lib/trans-jsonp-receiver.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// Parts derived from Socket.io:
//    https://github.com/LearnBoost/socket.io/blob/0.6.17/lib/socket.io/transports/jsonp-polling.js
// and jQuery-JSONP:
//    https://code.google.com/p/jquery-jsonp/source/browse/trunk/core/jquery.jsonp.js
var jsonPGenericReceiver = function(url, callback) {
    var tref;
    var script = _document.createElement('script');
    var script2;  // Opera synchronous load trick.
    var close_script = function(frame) {
        if (script2) {
            script2.parentNode.removeChild(script2);
            script2 = null;
        }
        if (script) {
            clearTimeout(tref);
            script.parentNode.removeChild(script);
            script.onreadystatechange = script.onerror =
                script.onload = script.onclick = null;
            script = null;
            callback(frame);
            callback = null;
        }
    };

    // IE9 fires 'error' event after orsc or before, in random order.
    var loaded_okay = false;
    var error_timer = null;

    script.id = 'a' + utils.random_string(8);
    script.src = url;
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.onerror = function(e) {
        if (!error_timer) {
            // Delay firing close_script.
            error_timer = setTimeout(function() {
                if (!loaded_okay) {
                    close_script(utils.closeFrame(
                        1006,
                        "JSONP script loaded abnormally (onerror)"));
                }
            }, 1000);
        }
    };
    script.onload = function(e) {
        close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onload)"));
    };

    script.onreadystatechange = function(e) {
        if (/loaded|closed/.test(script.readyState)) {
            if (script && script.htmlFor && script.onclick) {
                loaded_okay = true;
                try {
                    // In IE, actually execute the script.
                    script.onclick();
                } catch (x) {}
            }
            if (script) {
                close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onreadystatechange)"));
            }
        }
    };
    // IE: event/htmlFor/onclick trick.
    // One can't rely on proper order for onreadystatechange. In order to
    // make sure, set a 'htmlFor' and 'event' properties, so that
    // script code will be installed as 'onclick' handler for the
    // script object. Later, onreadystatechange, manually execute this
    // code. FF and Chrome doesn't work with 'event' and 'htmlFor'
    // set. For reference see:
    //   http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
    // Also, read on that about script ordering:
    //   http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
    if (typeof script.async === 'undefined' && _document.attachEvent) {
        // According to mozilla docs, in recent browsers script.async defaults
        // to 'true', so we may use it to detect a good browser:
        // https://developer.mozilla.org/en/HTML/Element/script
        if (!/opera/i.test(navigator.userAgent)) {
            // Naively assume we're in IE
            try {
                script.htmlFor = script.id;
                script.event = "onclick";
            } catch (x) {}
            script.async = true;
        } else {
            // Opera, second sync script hack
            script2 = _document.createElement('script');
            script2.text = "try{var a = document.getElementById('"+script.id+"'); if(a)a.onerror();}catch(x){};";
            script.async = script2.async = false;
        }
    }
    if (typeof script.async !== 'undefined') {
        script.async = true;
    }

    // Fallback mostly for Konqueror - stupid timer, 35 seconds shall be plenty.
    tref = setTimeout(function() {
                          close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (timeout)"));
                      }, 35000);

    var head = _document.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);
    if (script2) {
        head.insertBefore(script2, head.firstChild);
    }
    return close_script;
};
//         [*] End of lib/trans-jsonp-receiver.js


//         [*] Including lib/trans-jsonp-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// The simplest and most robust transport, using the well-know cross
// domain hack - JSONP. This transport is quite inefficient - one
// mssage could use up to one http request. But at least it works almost
// everywhere.
// Known limitations:
//   o you will get a spinning cursor
//   o for Konqueror a dumb timer is needed to detect errors


var JsonPTransport = SockJS['jsonp-polling'] = function(ri, trans_url) {
    utils.polluteGlobalNamespace();
    var that = this;
    that.ri = ri;
    that.trans_url = trans_url;
    that.send_constructor(jsonPGenericSender);
    that._schedule_recv();
};

// Inheritnace
JsonPTransport.prototype = new BufferedSender();

JsonPTransport.prototype._schedule_recv = function() {
    var that = this;
    var callback = function(data) {
        that._recv_stop = null;
        if (data) {
            // no data - heartbeat;
            if (!that._is_closing) {
                that.ri._didMessage(data);
            }
        }
        // The message can be a close message, and change is_closing state.
        if (!that._is_closing) {
            that._schedule_recv();
        }
    };
    that._recv_stop = jsonPReceiverWrapper(that.trans_url + '/jsonp',
                                           jsonPGenericReceiver, callback);
};

JsonPTransport.enabled = function() {
    return true;
};

JsonPTransport.need_body = true;


JsonPTransport.prototype.doCleanup = function() {
    var that = this;
    that._is_closing = true;
    if (that._recv_stop) {
        that._recv_stop();
    }
    that.ri = that._recv_stop = null;
    that.send_destructor();
};


// Abstract away code that handles global namespace pollution.
var jsonPReceiverWrapper = function(url, constructReceiver, user_callback) {
    var id = 'a' + utils.random_string(6);
    var url_id = url + '?c=' + escape(WPrefix + '.' + id);
    // Callback will be called exactly once.
    var callback = function(frame) {
        delete _window[WPrefix][id];
        user_callback(frame);
    };

    var close_script = constructReceiver(url_id, callback);
    _window[WPrefix][id] = close_script;
    var stop = function() {
        if (_window[WPrefix][id]) {
            _window[WPrefix][id](utils.closeFrame(1000, "JSONP user aborted read"));
        }
    };
    return stop;
};
//         [*] End of lib/trans-jsonp-polling.js


//         [*] Including lib/trans-xhr.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var AjaxBasedTransport = function() {};
AjaxBasedTransport.prototype = new BufferedSender();

AjaxBasedTransport.prototype.run = function(ri, trans_url,
                                            url_suffix, Receiver, AjaxObject) {
    var that = this;
    that.ri = ri;
    that.trans_url = trans_url;
    that.send_constructor(createAjaxSender(AjaxObject));
    that.poll = new Polling(ri, Receiver,
                            trans_url + url_suffix, AjaxObject);
};

AjaxBasedTransport.prototype.doCleanup = function() {
    var that = this;
    if (that.poll) {
        that.poll.abort();
        that.poll = null;
    }
};

// xhr-streaming
var XhrStreamingTransport = SockJS['xhr-streaming'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr_streaming', XhrReceiver, utils.XHRCorsObject);
};

XhrStreamingTransport.prototype = new AjaxBasedTransport();

XhrStreamingTransport.enabled = function() {
    // Support for CORS Ajax aka Ajax2? Opera 12 claims CORS but
    // doesn't do streaming.
    return (_window.XMLHttpRequest &&
            'withCredentials' in new XMLHttpRequest() &&
            (!/opera/i.test(navigator.userAgent)));
};
XhrStreamingTransport.roundTrips = 2; // preflight, ajax

// Safari gets confused when a streaming ajax request is started
// before onload. This causes the load indicator to spin indefinetely.
XhrStreamingTransport.need_body = true;


// According to:
//   http://stackoverflow.com/questions/1641507/detect-browser-support-for-cross-domain-xmlhttprequests
//   http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/


// xdr-streaming
var XdrStreamingTransport = SockJS['xdr-streaming'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr_streaming', XhrReceiver, utils.XDRObject);
};

XdrStreamingTransport.prototype = new AjaxBasedTransport();

XdrStreamingTransport.enabled = function() {
    return !!_window.XDomainRequest;
};
XdrStreamingTransport.roundTrips = 2; // preflight, ajax



// xhr-polling
var XhrPollingTransport = SockJS['xhr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XHRCorsObject);
};

XhrPollingTransport.prototype = new AjaxBasedTransport();

XhrPollingTransport.enabled = XhrStreamingTransport.enabled;
XhrPollingTransport.roundTrips = 2; // preflight, ajax


// xdr-polling
var XdrPollingTransport = SockJS['xdr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XDRObject);
};

XdrPollingTransport.prototype = new AjaxBasedTransport();

XdrPollingTransport.enabled = XdrStreamingTransport.enabled;
XdrPollingTransport.roundTrips = 2; // preflight, ajax
//         [*] End of lib/trans-xhr.js


//         [*] Including lib/trans-iframe.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// Few cool transports do work only for same-origin. In order to make
// them working cross-domain we shall use iframe, served form the
// remote domain. New browsers, have capabilities to communicate with
// cross domain iframe, using postMessage(). In IE it was implemented
// from IE 8+, but of course, IE got some details wrong:
//    http://msdn.microsoft.com/en-us/library/cc197015(v=VS.85).aspx
//    http://stevesouders.com/misc/test-postmessage.php

var IframeTransport = function() {};

IframeTransport.prototype.i_constructor = function(ri, trans_url, base_url) {
    var that = this;
    that.ri = ri;
    that.origin = utils.getOrigin(base_url);
    that.base_url = base_url;
    that.trans_url = trans_url;

    var iframe_url = base_url + '/iframe.html';
    if (that.ri._options.devel) {
        iframe_url += '?t=' + (+new Date);
    }
    that.window_id = utils.random_string(8);
    iframe_url += '#' + that.window_id;

    that.iframeObj = utils.createIframe(iframe_url, function(r) {
                                            that.ri._didClose(1006, "Unable to load an iframe (" + r + ")");
                                        });

    that.onmessage_cb = utils.bind(that.onmessage, that);
    utils.attachMessage(that.onmessage_cb);
};

IframeTransport.prototype.doCleanup = function() {
    var that = this;
    if (that.iframeObj) {
        utils.detachMessage(that.onmessage_cb);
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (that.iframeObj.iframe.contentWindow) {
                that.postMessage('c');
            }
        } catch (x) {}
        that.iframeObj.cleanup();
        that.iframeObj = null;
        that.onmessage_cb = that.iframeObj = null;
    }
};

IframeTransport.prototype.onmessage = function(e) {
    var that = this;
    if (e.origin !== that.origin) return;
    var window_id = e.data.slice(0, 8);
    var type = e.data.slice(8, 9);
    var data = e.data.slice(9);

    if (window_id !== that.window_id) return;

    switch(type) {
    case 's':
        that.iframeObj.loaded();
        that.postMessage('s', JSON.stringify([SockJS.version, that.protocol, that.trans_url, that.base_url]));
        break;
    case 't':
        that.ri._didMessage(data);
        break;
    }
};

IframeTransport.prototype.postMessage = function(type, data) {
    var that = this;
    that.iframeObj.post(that.window_id + type + (data || ''), that.origin);
};

IframeTransport.prototype.doSend = function (message) {
    this.postMessage('m', message);
};

IframeTransport.enabled = function() {
    // postMessage misbehaves in konqueror 4.6.5 - the messages are delivered with
    // huge delay, or not at all.
    var konqueror = navigator && navigator.userAgent && navigator.userAgent.indexOf('Konqueror') !== -1;
    return ((typeof _window.postMessage === 'function' ||
            typeof _window.postMessage === 'object') && (!konqueror));
};
//         [*] End of lib/trans-iframe.js


//         [*] Including lib/trans-iframe-within.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var curr_window_id;

var postMessage = function (type, data) {
    if(parent !== _window) {
        parent.postMessage(curr_window_id + type + (data || ''), '*');
    } else {
        utils.log("Can't postMessage, no parent window.", type, data);
    }
};

var FacadeJS = function() {};
FacadeJS.prototype._didClose = function (code, reason) {
    postMessage('t', utils.closeFrame(code, reason));
};
FacadeJS.prototype._didMessage = function (frame) {
    postMessage('t', frame);
};
FacadeJS.prototype._doSend = function (data) {
    this._transport.doSend(data);
};
FacadeJS.prototype._doCleanup = function () {
    this._transport.doCleanup();
};

utils.parent_origin = undefined;

SockJS.bootstrap_iframe = function() {
    var facade;
    curr_window_id = _document.location.hash.slice(1);
    var onMessage = function(e) {
        if(e.source !== parent) return;
        if(typeof utils.parent_origin === 'undefined')
            utils.parent_origin = e.origin;
        if (e.origin !== utils.parent_origin) return;

        var window_id = e.data.slice(0, 8);
        var type = e.data.slice(8, 9);
        var data = e.data.slice(9);
        if (window_id !== curr_window_id) return;
        switch(type) {
        case 's':
            var p = JSON.parse(data);
            var version = p[0];
            var protocol = p[1];
            var trans_url = p[2];
            var base_url = p[3];
            if (version !== SockJS.version) {
                utils.log("Incompatibile SockJS! Main site uses:" +
                          " \"" + version + "\", the iframe:" +
                          " \"" + SockJS.version + "\".");
            }
            if (!utils.flatUrl(trans_url) || !utils.flatUrl(base_url)) {
                utils.log("Only basic urls are supported in SockJS");
                return;
            }

            if (!utils.isSameOriginUrl(trans_url) ||
                !utils.isSameOriginUrl(base_url)) {
                utils.log("Can't connect to different domain from within an " +
                          "iframe. (" + JSON.stringify([_window.location.href, trans_url, base_url]) +
                          ")");
                return;
            }
            facade = new FacadeJS();
            facade._transport = new FacadeJS[protocol](facade, trans_url, base_url);
            break;
        case 'm':
            facade._doSend(data);
            break;
        case 'c':
            if (facade)
                facade._doCleanup();
            facade = null;
            break;
        }
    };

    // alert('test ticker');
    // facade = new FacadeJS();
    // facade._transport = new FacadeJS['w-iframe-xhr-polling'](facade, 'http://host.com:9999/ticker/12/basd');

    utils.attachMessage(onMessage);

    // Start
    postMessage('s');
};
//         [*] End of lib/trans-iframe-within.js


//         [*] Including lib/info.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var InfoReceiver = function(base_url, AjaxObject) {
    var that = this;
    utils.delay(function(){that.doXhr(base_url, AjaxObject);});
};

InfoReceiver.prototype = new EventEmitter(['finish']);

InfoReceiver.prototype.doXhr = function(base_url, AjaxObject) {
    var that = this;
    var t0 = (new Date()).getTime();
    var xo = new AjaxObject('GET', base_url + '/info');

    var tref = utils.delay(8000,
                           function(){xo.ontimeout();});

    xo.onfinish = function(status, text) {
        clearTimeout(tref);
        tref = null;
        if (status === 200) {
            var rtt = (new Date()).getTime() - t0;
            var info = JSON.parse(text);
            if (typeof info !== 'object') info = {};
            that.emit('finish', info, rtt);
        } else {
            that.emit('finish');
        }
    };
    xo.ontimeout = function() {
        xo.close();
        that.emit('finish');
    };
};

var InfoReceiverIframe = function(base_url) {
    var that = this;
    var go = function() {
        var ifr = new IframeTransport();
        ifr.protocol = 'w-iframe-info-receiver';
        var fun = function(r) {
            if (typeof r === 'string' && r.substr(0,1) === 'm') {
                var d = JSON.parse(r.substr(1));
                var info = d[0], rtt = d[1];
                that.emit('finish', info, rtt);
            } else {
                that.emit('finish');
            }
            ifr.doCleanup();
            ifr = null;
        };
        var mock_ri = {
            _options: {},
            _didClose: fun,
            _didMessage: fun
        };
        ifr.i_constructor(mock_ri, base_url, base_url);
    }
    if(!_document.body) {
        utils.attachEvent('load', go);
    } else {
        go();
    }
};
InfoReceiverIframe.prototype = new EventEmitter(['finish']);


var InfoReceiverFake = function() {
    // It may not be possible to do cross domain AJAX to get the info
    // data, for example for IE7. But we want to run JSONP, so let's
    // fake the response, with rtt=2s (rto=6s).
    var that = this;
    utils.delay(function() {
        that.emit('finish', {}, 2000);
    });
};
InfoReceiverFake.prototype = new EventEmitter(['finish']);

var createInfoReceiver = function(base_url) {
    if (utils.isSameOriginUrl(base_url)) {
        // If, for some reason, we have SockJS locally - there's no
        // need to start up the complex machinery. Just use ajax.
        return new InfoReceiver(base_url, utils.XHRLocalObject);
    }
    switch (utils.isXHRCorsCapable()) {
    case 1:
        return new InfoReceiver(base_url, utils.XHRCorsObject);
    case 2:
        return new InfoReceiver(base_url, utils.XDRObject);
    case 3:
        // Opera
        return new InfoReceiverIframe(base_url);
    default:
        // IE 7
        return new InfoReceiverFake();
    };
};


var WInfoReceiverIframe = FacadeJS['w-iframe-info-receiver'] = function(ri, _trans_url, base_url) {
    var ir = new InfoReceiver(base_url, utils.XHRLocalObject);
    ir.onfinish = function(info, rtt) {
        ri._didMessage('m'+JSON.stringify([info, rtt]));
        ri._didClose();
    }
};
WInfoReceiverIframe.prototype.doCleanup = function() {};
//         [*] End of lib/info.js


//         [*] Including lib/trans-iframe-eventsource.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventSourceIframeTransport = SockJS['iframe-eventsource'] = function () {
    var that = this;
    that.protocol = 'w-iframe-eventsource';
    that.i_constructor.apply(that, arguments);
};

EventSourceIframeTransport.prototype = new IframeTransport();

EventSourceIframeTransport.enabled = function () {
    return ('EventSource' in _window) && IframeTransport.enabled();
};

EventSourceIframeTransport.need_body = true;
EventSourceIframeTransport.roundTrips = 3; // html, javascript, eventsource


// w-iframe-eventsource
var EventSourceTransport = FacadeJS['w-iframe-eventsource'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/eventsource', EventSourceReceiver, utils.XHRLocalObject);
}
EventSourceTransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-eventsource.js


//         [*] Including lib/trans-iframe-xhr-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var XhrPollingIframeTransport = SockJS['iframe-xhr-polling'] = function () {
    var that = this;
    that.protocol = 'w-iframe-xhr-polling';
    that.i_constructor.apply(that, arguments);
};

XhrPollingIframeTransport.prototype = new IframeTransport();

XhrPollingIframeTransport.enabled = function () {
    return _window.XMLHttpRequest && IframeTransport.enabled();
};

XhrPollingIframeTransport.need_body = true;
XhrPollingIframeTransport.roundTrips = 3; // html, javascript, xhr


// w-iframe-xhr-polling
var XhrPollingITransport = FacadeJS['w-iframe-xhr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XHRLocalObject);
};

XhrPollingITransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-xhr-polling.js


//         [*] Including lib/trans-iframe-htmlfile.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// This transport generally works in any browser, but will cause a
// spinning cursor to appear in any browser other than IE.
// We may test this transport in all browsers - why not, but in
// production it should be only run in IE.

var HtmlFileIframeTransport = SockJS['iframe-htmlfile'] = function () {
    var that = this;
    that.protocol = 'w-iframe-htmlfile';
    that.i_constructor.apply(that, arguments);
};

// Inheritance.
HtmlFileIframeTransport.prototype = new IframeTransport();

HtmlFileIframeTransport.enabled = function() {
    return IframeTransport.enabled();
};

HtmlFileIframeTransport.need_body = true;
HtmlFileIframeTransport.roundTrips = 3; // html, javascript, htmlfile


// w-iframe-htmlfile
var HtmlFileTransport = FacadeJS['w-iframe-htmlfile'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/htmlfile', HtmlfileReceiver, utils.XHRLocalObject);
};
HtmlFileTransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-htmlfile.js


//         [*] Including lib/trans-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var Polling = function(ri, Receiver, recv_url, AjaxObject) {
    var that = this;
    that.ri = ri;
    that.Receiver = Receiver;
    that.recv_url = recv_url;
    that.AjaxObject = AjaxObject;
    that._scheduleRecv();
};

Polling.prototype._scheduleRecv = function() {
    var that = this;
    var poll = that.poll = new that.Receiver(that.recv_url, that.AjaxObject);
    var msg_counter = 0;
    poll.onmessage = function(e) {
        msg_counter += 1;
        that.ri._didMessage(e.data);
    };
    poll.onclose = function(e) {
        that.poll = poll = poll.onmessage = poll.onclose = null;
        if (!that.poll_is_closing) {
            if (e.reason === 'permanent') {
                that.ri._didClose(1006, 'Polling error (' + e.reason + ')');
            } else {
                that._scheduleRecv();
            }
        }
    };
};

Polling.prototype.abort = function() {
    var that = this;
    that.poll_is_closing = true;
    if (that.poll) {
        that.poll.abort();
    }
};
//         [*] End of lib/trans-polling.js


//         [*] Including lib/trans-receiver-eventsource.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventSourceReceiver = function(url) {
    var that = this;
    var es = new EventSource(url);
    es.onmessage = function(e) {
        that.dispatchEvent(new SimpleEvent('message',
                                           {'data': unescape(e.data)}));
    };
    that.es_close = es.onerror = function(e, abort_reason) {
        // ES on reconnection has readyState = 0 or 1.
        // on network error it's CLOSED = 2
        var reason = abort_reason ? 'user' :
            (es.readyState !== 2 ? 'network' : 'permanent');
        that.es_close = es.onmessage = es.onerror = null;
        // EventSource reconnects automatically.
        es.close();
        es = null;
        // Safari and chrome < 15 crash if we close window before
        // waiting for ES cleanup. See:
        //   https://code.google.com/p/chromium/issues/detail?id=89155
        utils.delay(200, function() {
                        that.dispatchEvent(new SimpleEvent('close', {reason: reason}));
                    });
    };
};

EventSourceReceiver.prototype = new REventTarget();

EventSourceReceiver.prototype.abort = function() {
    var that = this;
    if (that.es_close) {
        that.es_close({}, true);
    }
};
//         [*] End of lib/trans-receiver-eventsource.js


//         [*] Including lib/trans-receiver-htmlfile.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var _is_ie_htmlfile_capable;
var isIeHtmlfileCapable = function() {
    if (_is_ie_htmlfile_capable === undefined) {
        if ('ActiveXObject' in _window) {
            try {
                _is_ie_htmlfile_capable = !!new ActiveXObject('htmlfile');
            } catch (x) {}
        } else {
            _is_ie_htmlfile_capable = false;
        }
    }
    return _is_ie_htmlfile_capable;
};


var HtmlfileReceiver = function(url) {
    var that = this;
    utils.polluteGlobalNamespace();

    that.id = 'a' + utils.random_string(6, 26);
    url += ((url.indexOf('?') === -1) ? '?' : '&') +
        'c=' + escape(WPrefix + '.' + that.id);

    var constructor = isIeHtmlfileCapable() ?
        utils.createHtmlfile : utils.createIframe;

    var iframeObj;
    _window[WPrefix][that.id] = {
        start: function () {
            iframeObj.loaded();
        },
        message: function (data) {
            that.dispatchEvent(new SimpleEvent('message', {'data': data}));
        },
        stop: function () {
            that.iframe_close({}, 'network');
        }
    };
    that.iframe_close = function(e, abort_reason) {
        iframeObj.cleanup();
        that.iframe_close = iframeObj = null;
        delete _window[WPrefix][that.id];
        that.dispatchEvent(new SimpleEvent('close', {reason: abort_reason}));
    };
    iframeObj = constructor(url, function(e) {
                                that.iframe_close({}, 'permanent');
                            });
};

HtmlfileReceiver.prototype = new REventTarget();

HtmlfileReceiver.prototype.abort = function() {
    var that = this;
    if (that.iframe_close) {
        that.iframe_close({}, 'user');
    }
};
//         [*] End of lib/trans-receiver-htmlfile.js


//         [*] Including lib/trans-receiver-xhr.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var XhrReceiver = function(url, AjaxObject) {
    var that = this;
    var buf_pos = 0;

    that.xo = new AjaxObject('POST', url, null);
    that.xo.onchunk = function(status, text) {
        if (status !== 200) return;
        while (1) {
            var buf = text.slice(buf_pos);
            var p = buf.indexOf('\n');
            if (p === -1) break;
            buf_pos += p+1;
            var msg = buf.slice(0, p);
            that.dispatchEvent(new SimpleEvent('message', {data: msg}));
        }
    };
    that.xo.onfinish = function(status, text) {
        that.xo.onchunk(status, text);
        that.xo = null;
        var reason = status === 200 ? 'network' : 'permanent';
        that.dispatchEvent(new SimpleEvent('close', {reason: reason}));
    }
};

XhrReceiver.prototype = new REventTarget();

XhrReceiver.prototype.abort = function() {
    var that = this;
    if (that.xo) {
        that.xo.close();
        that.dispatchEvent(new SimpleEvent('close', {reason: 'user'}));
        that.xo = null;
    }
};
//         [*] End of lib/trans-receiver-xhr.js


//         [*] Including lib/test-hooks.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// For testing
SockJS.getUtils = function(){
    return utils;
};

SockJS.getIframeTransport = function(){
    return IframeTransport;
};
//         [*] End of lib/test-hooks.js

                  return SockJS;
          })();
if ('_sockjs_onload' in window) setTimeout(_sockjs_onload, 1);

// AMD compliance
if (typeof define === 'function' && define.amd) {
    define('sockjs', [], function(){return SockJS;});
}

if (typeof module === 'object' && module && module.exports) {
    module.exports = SockJS;
}
//     [*] End of lib/index.js

// [*] End of lib/all.js


},{}],97:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":66,"inherits":68,"readable-stream/duplex.js":79,"readable-stream/passthrough.js":90,"readable-stream/readable.js":91,"readable-stream/transform.js":92,"readable-stream/writable.js":93}],98:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":74,"timers":98}],99:[function(require,module,exports){
var traverse = module.exports = function (obj) {
    return new Traverse(obj);
};

function Traverse (obj) {
    this.value = obj;
}

Traverse.prototype.get = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            node = undefined;
            break;
        }
        node = node[key];
    }
    return node;
};

Traverse.prototype.has = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            return false;
        }
        node = node[key];
    }
    return true;
};

Traverse.prototype.set = function (ps, value) {
    var node = this.value;
    for (var i = 0; i < ps.length - 1; i ++) {
        var key = ps[i];
        if (!hasOwnProperty.call(node, key)) node[key] = {};
        node = node[key];
    }
    node[ps[i]] = value;
    return value;
};

Traverse.prototype.map = function (cb) {
    return walk(this.value, cb, true);
};

Traverse.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb, false);
    return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
    var skip = arguments.length === 1;
    var acc = skip ? this.value : init;
    this.forEach(function (x) {
        if (!this.isRoot || !skip) {
            acc = cb.call(this, acc, x);
        }
    });
    return acc;
};

Traverse.prototype.paths = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.path); 
    });
    return acc;
};

Traverse.prototype.nodes = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.node);
    });
    return acc;
};

Traverse.prototype.clone = function () {
    var parents = [], nodes = [];
    
    return (function clone (src) {
        for (var i = 0; i < parents.length; i++) {
            if (parents[i] === src) {
                return nodes[i];
            }
        }
        
        if (typeof src === 'object' && src !== null) {
            var dst = copy(src);
            
            parents.push(src);
            nodes.push(dst);
            
            forEach(objectKeys(src), function (key) {
                dst[key] = clone(src[key]);
            });
            
            parents.pop();
            nodes.pop();
            return dst;
        }
        else {
            return src;
        }
    })(this.value);
};

function walk (root, cb, immutable) {
    var path = [];
    var parents = [];
    var alive = true;
    
    return (function walker (node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};
        
        var keepGoing = true;
        
        var state = {
            node : node,
            node_ : node_,
            path : [].concat(path),
            parent : parents[parents.length - 1],
            parents : parents,
            key : path.slice(-1)[0],
            isRoot : path.length === 0,
            level : path.length,
            circular : null,
            update : function (x, stopHere) {
                if (!state.isRoot) {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
                if (stopHere) keepGoing = false;
            },
            'delete' : function (stopHere) {
                delete state.parent.node[state.key];
                if (stopHere) keepGoing = false;
            },
            remove : function (stopHere) {
                if (isArray(state.parent.node)) {
                    state.parent.node.splice(state.key, 1);
                }
                else {
                    delete state.parent.node[state.key];
                }
                if (stopHere) keepGoing = false;
            },
            keys : null,
            before : function (f) { modifiers.before = f },
            after : function (f) { modifiers.after = f },
            pre : function (f) { modifiers.pre = f },
            post : function (f) { modifiers.post = f },
            stop : function () { alive = false },
            block : function () { keepGoing = false }
        };
        
        if (!alive) return state;
        
        function updateState() {
            if (typeof state.node === 'object' && state.node !== null) {
                if (!state.keys || state.node_ !== state.node) {
                    state.keys = objectKeys(state.node)
                }
                
                state.isLeaf = state.keys.length == 0;
                
                for (var i = 0; i < parents.length; i++) {
                    if (parents[i].node_ === node_) {
                        state.circular = parents[i];
                        break;
                    }
                }
            }
            else {
                state.isLeaf = true;
                state.keys = null;
            }
            
            state.notLeaf = !state.isLeaf;
            state.notRoot = !state.isRoot;
        }
        
        updateState();
        
        // use return values to update if defined
        var ret = cb.call(state, state.node);
        if (ret !== undefined && state.update) state.update(ret);
        
        if (modifiers.before) modifiers.before.call(state, state.node);
        
        if (!keepGoing) return state;
        
        if (typeof state.node == 'object'
        && state.node !== null && !state.circular) {
            parents.push(state);
            
            updateState();
            
            forEach(state.keys, function (key, i) {
                path.push(key);
                
                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                
                var child = walker(state.node[key]);
                if (immutable && hasOwnProperty.call(state.node, key)) {
                    state.node[key] = child.node;
                }
                
                child.isLast = i == state.keys.length - 1;
                child.isFirst = i == 0;
                
                if (modifiers.post) modifiers.post.call(state, child);
                
                path.pop();
            });
            parents.pop();
        }
        
        if (modifiers.after) modifiers.after.call(state, state.node);
        
        return state;
    })(root).node;
}

function copy (src) {
    if (typeof src === 'object' && src !== null) {
        var dst;
        
        if (isArray(src)) {
            dst = [];
        }
        else if (isDate(src)) {
            dst = new Date(src.getTime ? src.getTime() : src);
        }
        else if (isRegExp(src)) {
            dst = new RegExp(src);
        }
        else if (isError(src)) {
            dst = { message: src.message };
        }
        else if (isBoolean(src)) {
            dst = new Boolean(src);
        }
        else if (isNumber(src)) {
            dst = new Number(src);
        }
        else if (isString(src)) {
            dst = new String(src);
        }
        else if (Object.create && Object.getPrototypeOf) {
            dst = Object.create(Object.getPrototypeOf(src));
        }
        else if (src.constructor === Object) {
            dst = {};
        }
        else {
            var proto =
                (src.constructor && src.constructor.prototype)
                || src.__proto__
                || {}
            ;
            var T = function () {};
            T.prototype = proto;
            dst = new T;
        }
        
        forEach(objectKeys(src), function (key) {
            dst[key] = src[key];
        });
        return dst;
    }
    else return src;
}

var objectKeys = Object.keys || function keys (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

function toS (obj) { return Object.prototype.toString.call(obj) }
function isDate (obj) { return toS(obj) === '[object Date]' }
function isRegExp (obj) { return toS(obj) === '[object RegExp]' }
function isError (obj) { return toS(obj) === '[object Error]' }
function isBoolean (obj) { return toS(obj) === '[object Boolean]' }
function isNumber (obj) { return toS(obj) === '[object Number]' }
function isString (obj) { return toS(obj) === '[object String]' }

var isArray = Array.isArray || function isArray (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

forEach(objectKeys(Traverse.prototype), function (key) {
    traverse[key] = function (obj) {
        var args = [].slice.call(arguments, 1);
        var t = new Traverse(obj);
        return t[key].apply(t, args);
    };
});

var hasOwnProperty = Object.hasOwnProperty || function (obj, key) {
    return key in obj;
};

},{}],100:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":101,"punycode":75,"querystring":78}],101:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],102:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[20]);
