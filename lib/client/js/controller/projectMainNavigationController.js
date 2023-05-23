var canny = require('canny'),
    domOpts = require('dom-opts'),
    trade = require('../trade.js'),
    events = require('../events.js'),
    uiEvents = require('../uiEventManager.js'),
    keyValueCounter = {
        projectMap : {},
        getCountObj : function () {
            return {
                keyMap : {}, // just collect all unique keys for getting total number of existing keys
                langMap : {}   // save for each language all "valid" keys
            }
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
        enableEditorMode : function (enabled) {
            editorModeEnabled = enabled;
        }
    });

}());

(function() {
    var wordCountEnabled = false;

    canny.projectMainNavigation.onToggleWordCount(function() {
        wordCountEnabled = !wordCountEnabled;
        uiEvents.callUievent('toggleWordCount', wordCountEnabled);
    });
}());

canny.projectMainNavigation.onShowJSON(function () {
    console.log('projectMainNavigationController:onShowJSON show JSON format in new tab.');
    window.open(
        '/' + projectInfo.id + '.json?category=true',
        '_blank' // <- This is what makes it open in a new window.
    );
});

canny.projectMainNavigation.onShowJsonEditor(function() {
    uiEvents.callUievent('showJsonEditor')
});

canny.projectMainNavigation.onShowCopyModal(function() {
    uiEvents.callUievent('showCopyModal')
});

canny.projectMainNavigation.onShowJMBFUploader(function () {
    uiEvents.callUievent('showJMBFUploader')
});

canny.projectMainNavigation.onShowJSONImport(function () {
    uiEvents.callUievent('showJSONImport');
});

canny.projectMainNavigation.onShowJMBF(function () {
    var lang = window.prompt('Enter a language code. E.g.: ' +  (function () {
            var existingLanguages = [];
            Object.keys(projectConfig.keys).forEach(function (lang) {
                if (Object.keys(projectConfig.keys[lang]).length > 0) {
                    existingLanguages.push(lang)
                }
            });
            return existingLanguages;
        }()).join(', '));

    if (lang !== null) {
        window.open(
            '/' + projectInfo.id + '.properties' + (lang !== '' ? '?lang=' + lang : ''),
            '_blank' // <- This is what makes it open in a new window.
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
    updateKey : function (projectName, lang, key, value) {
        console.log('projectMainNavigationController:updateKey', projectName, lang, key, value);
        updateKeyToProjectMap(projectName, lang, key, value);
    },
    projectSelected : function (projectId) {
        console.log('projectMainNavigationController:projectSelected Click on project', projectId);
        trade.loadProject(projectId, function (error) {
            if (error === false)
                console.error('projectMainNavigationController:loadProject fails for projectId:', projectId);
        });
    },
    activateLanguage : function (lang) {
        canny.projectMainNavigation.activateLang(lang);
    },
    deActivateLanguage : function (lang) {
        canny.projectMainNavigation.deActivateLang(lang);
    },
    addLanguage : function (lang) {
        canny.projectMainNavigation.activateLang(lang);
    }
});

function computeTotalTranslationProgree(translations) {
    var totalProgress = {};
    Object.keys(translations).forEach(function(lang) {
        Object.keys(translations[lang]).forEach(function (key) {
            totalProgress[key] = undefined;
        });
    });
    return Object.keys(totalProgress).length;

}

function computeTranslationProgress(translations) {
    var progressByLanguage = {};
    Object.keys(translations).forEach(function(lang) {
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
    projectInfo = project

    canny.projectMainNavigation.setAvailableLanguages(data.availableLanguages);

    canny.projectMainNavigation.setActivatedProjectLanguages(
        computeTotalTranslationProgree(data.keys), computeTranslationProgress(data.keys));

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
    onNewProjectCreated : applyProjectData,
    onLoadProject : applyProjectData
};