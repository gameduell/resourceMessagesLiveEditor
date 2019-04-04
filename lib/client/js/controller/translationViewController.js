var canny = require("canny"),
    translationView = require('../uiModules/translationView'),
    translationViewImageUpload = require('../uiModules/translationViewImageUpload'),
    wordCounter = require('../util/wordCounter'),
    domOpts = require('dom-opts'),
    uiEvents = require('../uiEventManager.js'),
    events = require('../events.js'),
    trade = require('../trade.js'),
    url = require('../util/url'),
    sortByKey = function(a, b) {
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
    sortLanguages = function(a, b) {
        return orderedLanguages.indexOf(a) - orderedLanguages.indexOf(b);
    };

translationViewImageUpload.onUploadButton(function(id) {
    uiEvents.callUievent('showFileUpload', id);
});

translationViewImageUpload.onDeleteButton(function(id) {
    if (confirm('Delete the image for category » ' + id + ' « forever?')) {
        trade.removeImage(projectInfo.id, id);
    }
});

translationView.onCategoryClicked(function(id) {
    uiEvents.callUievent('anchorFocus', '#' + id);
});
/**
 * Setup the UI events and manage the logic for them.
 *
 * TODO replace bundle with locale and refactor the calls from translationView
 */
translationView.onSaveKey(function(key, lang, value) {

    // TODO: Count words and tell word count label to update

    console.log('translationViewController:onSaveValue', [].slice.call(arguments));
    trade.saveKey(
        projectInfo.id,
        lang || projectConfig.defaultLanguage,
        {
            key: key,
            value: value || undefined
        },
        function(projectId, language, key, value) {
            var catId;

            if (projectId === projectInfo.id) { // prevent applying the callback if project has been changed in the meantime
                catId = key.split('_')[0];
                existingKeys[key] = undefined; // save the key
                projectConfig.keys[lang][key] = value;
                translationView.printBundleTemplate([{
                    key: key,
                    value: value || ''
                }], language, availableLanguages, function() {
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
translationView.onCreateKey(function(key, lang, value) {
    console.log('translationViewController:onSaveValue', [].slice.call(arguments));
    trade.createKey(
        projectInfo.id,
        lang || projectConfig.defaultLanguage,
        {
            key: key,
            value: value || undefined
        },
        function(projectId, language, key, value) {
            var catId = key.split('_')[0];
            if (projectId === projectInfo.id) { // prevent applying the callback if project has been changed in the meantime
                existingKeys[key] = undefined; // save the key
                projectConfig.keys[language] = projectConfig.keys[language] ? projectConfig.keys[language] : {};
                projectConfig.keys[language][key] = value;
                translationView.printBundleTemplate([{
                    key: key,
                    value: value || '',
                    words: 0
                }], language, availableLanguages, function() {
                    updateCategoryWordCount(catId, language);
                });
                toast.showMessage('Auto save: "' + key + '" (success)');

                translationView.sendSuccess(key, 'value_');
                // TODO not sure if this is needed
                uiEvents.callUievent('updateKey', projectId, language, key, value);
            }
        });
});

translationView.onCloneKey(function(keyId, keyName, fromCategory, toCategory) {
    trade.cloneKey(
        projectInfo.id,
        {
            id: keyId,
            key: keyName,
            sourceCategory: fromCategory,
            targetCategory: toCategory
        },
        function(err, projectId, data) {
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
                        }], lang, availableLanguages, function() {
                            updateCategoryWordCount(toCategory, lang);
                        });
                    }
                }
                canny.translationViewDescription.addDescriptions(data.keyDescriptions);
            }
        }
    );
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
    availableLanguages =
        Object.keys(projectConfig.keys).length === 0 && JSON.stringify(projectConfig.keys) === JSON.stringify({}) ?
            [defaultLanguage] : Object.keys(projectConfig.keys);

    availableLanguages = availableLanguages.sort(sortLanguages)

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

translationView.onCreateNewProject(function(prjName, obj) {
    trade.createNewProject(prjName, obj);
});

translationView.onRemoveCategory(function(obj) {
    console.log('translationViewController:onRemoveCategory', obj, projectInfo.id);
    trade.removeCategory(projectInfo.id, obj.category);
});

translationView.onRenameCategory(function(obj) {
    console.log('translationViewController:onRenameCategory', obj, projectInfo.id)
    trade.renameCategory(projectInfo.id, obj.oldName, obj.newName);
});

translationView.onRenameKey(function(obj) {
    console.log('translationViewController:onRenameKey', obj, projectInfo.id);
    trade.renameKey(projectInfo.id, {
        newKey: obj.newKey,
        oldKey: obj.oldKey
    });
});

translationView.onRemoveKey(function(obj) {
    console.log('translationViewController:onRemoveKey', obj, projectInfo.id);
    trade.removeKey(projectInfo.id, obj.key, function(key) {
        var catName = key.split('_')[0];
        for(var lang in projectConfig.keys) {
            if (projectConfig.keys.hasOwnProperty(lang)) {
                delete projectConfig.keys[lang][key];
                updateCategoryWordCount(catName, lang);
            }
        }
    });
});

// register listener function to the ui events
uiEvents.addUiEventListener({
    activateLanguage: function(lang) {
//        translationViewHeader.showLang(lang);
        translationView.showLang(lang);
    },
    deActivateLanguage: function(lang) {
//        translationViewHeader.hideLang(lang);
        translationView.hideLang(lang);
    },
    toggleWordCount: function(active) {
        translationView.toggleWordCount(active);
    },
    // TODO  don't trigger it twice for the same language
    addLanguage: function(lang) {
        availableLanguages.push(lang);
        availableLanguages = availableLanguages.sort(sortLanguages);
        projectConfig.keys[lang] = {};
        translationView.addLanguage(
          Object.keys(existingKeys),
          lang,
          availableLanguages.indexOf(lang)
        );
//        translationViewHeader.showLang(lang);
        translationView.showLang(lang);
    },
    enableEditorMode: function(enabled) {
        translationView.enableEditorMode(enabled);
    },
    fileUploaded: function(projectId, key, url) {
        canny.translationViewImageUpload.appendImage(key, url)
    },
    JMBFFileUploaded: function(projectId) {
        trade.loadProject(projectId, function(error) {
            if (error === false)
                console.error('translationViewController:loadProject fails for projectId:', projectInfo.id);
        });
    },
    jsonImported: function(projectId) {
        trade.loadProject(projectId, function(error) {
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
events.addServerListener('keyUpdated', function() {
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
events.addServerListener('onKeyCloned', function() {
    console.log('events.listener::onKeyCloned' + [].slice.call(arguments));
});

/**
 * server event listener
 */
events.addServerListener('keyDeleted', function(bundleName, obj) {
    // TODO more client changes are coming, we'll finish the code below then
    //if (bundleName === projectConfig.project) {
    //    console.log('translationViewController:keyRenamed', bundleName, obj);
    //    toast.showMessage('Key deleted!' + obj.key);
    //    translationView.markKeyAsRemoved(obj.key);
    //}
});

events.addServerListener('categoryDeleted', function(bundleName, obj) {
    console.log('events.listener::categoryDeleted' + [].slice.call(arguments));
});

events.addServerListener('categoryRenamed', function(bundleName, obj) {
    console.log('events.listener::categoryRenamed' + [].slice.call(arguments));
});

/**
 * server event listener
 */
events.addServerListener('imageRemoved', function(bundleName, categoryName) {
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
    let wordCount = 0;
    Object.keys(projectConfig.keys[lang]).forEach(function(key) {
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
    Object.keys(projectConfig.keys).forEach(function(lang) {
        var langData = projectConfig.keys[lang];
        Object.keys(langData).forEach(function(key) {
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

    Object.keys(projectData.keys).forEach(function(lang) {
        var sorted, datas = [];
        Object.keys(projectData.keys[lang]).forEach(function(key) {
            datas.push({
                key: key,
                value: projectData.keys[lang][key]
            });
        });
        sorted = datas.sort(sortByKey);

        sorted.forEach(function(data) {
            existingKeys[data.key] = undefined;
        });

        // TODO projectConfig.project will be removed if the trade call moved to this controller
        translationView.printBundleTemplate(sorted, lang, availableLanguages, cb || function() {});

        categories.forEach(function(category) {
            updateCategoryWordCount(category, lang);
        });
    });
}

module.exports = {
    renameCategory: function(oldName, newName) {
        toast.showMessage('Renamed category ' + oldName + ' to ' + newName + '!');
        translationView.renameCategory(oldName, newName, availableLanguages);
    },
    removeCategory: function(catName) {
        toast.showMessage('Removed category ' + catName + '!');
        removeCategoryData(catName);
        translationView.removeCategory(catName);
    },
    /**
     * is called if the user rename key request was successful
     * @param newKey
     * @param oldKey
     */
    renameKey: function(oldKey, newKey) {
        if (oldKey) {
            toast.showMessage('Key renamed successful! From ' + oldKey + ' to ' + newKey);
            translationView.renameKey(oldKey, newKey, availableLanguages);
        } else {
            toast.showMessage('Key renamed failed!');
        }
    },
    removeKey: function(key) {
        toast.showMessage('Key removed successful!', key);
        translationView.removeKey(key);
    },
    imageRemoved: function(categoryName) {
        toast.showMessage('Image removed for category: ' + categoryName);
        translationView.removeImage(categoryName);
    },
    /**
     * Will be called with the complete JSON object from a specific project
     * @param projectData
     */
    onLoadProject: function(projectData, project) {
        orderedLanguages = projectData.availableLanguages;
        var anchor = url.hasAnchor() ? url.getAnchor().replace('#', '') : false;
        renderProject(projectData, project, function(viewId) {
            if (anchor) {
                if (viewId === anchor) {
                    var dom = document.getElementById(translationView.config.rowPrefix + viewId);
                    // do the element exists?
                    if (dom) {
                        uiEvents.callUievent('anchorFocus', url.getAnchor());
                        setTimeout(function() {
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
        Object.keys(projectData.images).forEach(function(key) {
            // images without a slash at front are old image upload - this is only to be backward compatible
            const url = projectData.images[key][0] === '/' ? projectData.images[key] : `/${project.id}/${projectData.images[key]}`
            canny.translationViewImageUpload.appendImage(key, url);
        })
    },
    onNewProjectCreated: function(projectData, project) {
        orderedLanguages = projectData.availableLanguages;
        renderProject(projectData, project);
    }
};