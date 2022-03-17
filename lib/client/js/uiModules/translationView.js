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
    Object.keys(conf).forEach(function(prop) {
        var node;
        if (prop === 'inputTransPrefix') {
            availableLanguages.forEach(function(lang) {
                node = document.getElementById(getLanguageTextId(oldKey, lang));
                if (node) {
                    node.setAttribute('id', getLanguageTextId(newKey, lang));
                } else {
                    console.error('translationView:renameIds can not find dom node for id', getLanguageTextId(newKey, lang));
                }
            })
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
    return (string.length > 0 && string.search('\\.|,| ') === -1) ? true : false;
}

function getLanguageTextId(key, lang) {
    return conf.inputTransPrefix + [key, lang].join('_');
}

function getWordCountText(count) {
    return 'Words: ' + count;
}

function checkOnNBSP(text) {
    return /\u00A0/.test(text)
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
    while (/{.*?}/.test(value)){//remove placeholders
        value = value.replace(/{.*?}/, '')
    }
    while (/<.*?>/.test(value)){//remove html tags
        value = value.replace(/<.*?>/, '')
    }
    while (/\\!/.test(value)){//remove leading slashes in front of !
        value = value.replace(/\\!/, '!')
    }
    return [...value].filter((char) => /[\D]/.test(char)).length
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
var translationView = (function() {
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

        node.addEventListener('change', function(e) {
            console.log("Old: " + textList[textIdx]);
            var newValue = this.value;
            if (textList[textIdx] !== newValue) {
                textList.push(newValue);
                textIdx++;
            }
            console.log(textList);
            onSaveKey && onSaveKey(getIdFromRow(node), lang, newValue);
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
        [].slice.call(rowNode.querySelectorAll('textarea')).forEach(function(tarea) {
            tarea.removeEventListener('change', false);
            tarea.setAttribute('readonly', 'true');
        });

        [].slice.call(rowNode.querySelectorAll('input')).forEach(function(input) {
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

    var rootNode, // main node all content are added to here
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
            sendSuccess: function(key, inputPrefix) {
                var node1 = document.getElementById(conf.rowPrefix + key),
                    node2 = document.getElementById(inputPrefix + key);
                if (node1) {
                    ui.removeStateClasses(node1).classList.remove(ui.css.sendSuccess);
                    setTimeout(function() {
                        ui.removeStateClasses(node1).classList.add(ui.css.sendSuccess);
                    }, 100)
                }
                if (node2) {
                    ui.removeStateClasses(node2).classList.remove(ui.css.sendSuccess);
                    setTimeout(function() {
                        ui.removeStateClasses(node2).classList.add(ui.css.sendSuccess);
                    }, 100)
                }
            },
            updateInputFields: function(key, inputPrefix) {
                console.error('translationView:updateInputFields', 'is this still in use????????????????????????????????????');
                debugger;
                var node = document.getElementById(inputPrefix + key);
                if (node) {
                    ui.removeStateClasses(node).domAddClass(ui.css.updateKey);
                }
            },
            removeStateClasses: function(node) {
                var cssState, classes = '';
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
        onSaveKey = function() {
            console.warn('translationView:onSaveKey not initialized');
        },
        onCreateKey = function() {
            console.warn('translationView:onCreateKey not initialized');
        },
        onCloneKey = function() {
            console.warn('translationView:onCloneKey not initialized');
        },
        brain = {
            cloneKeyOverlay: {
                init: function(node) {
                    this.node = node;
                },
                setData: function(data) {
                    this.data = data;
                    renderTextFc('cloneKeyOverlayText', {
                        keyName: data.keyName,
                        categoryName: data.contextName
                    });
                },
                getData: function() {
                    return this.data;
                }
            },
            cloneKeyInputCategory: {
                init: function(node) {
                    this.node = node;
                }
            },
            cloneKeyButtonSubmit: {
                init: function(node) {
                    node.addEventListener('click', function() {
                        if (brain.cloneKeyInputCategory.node.value.length === 0) {
                            brain.cloneKeyInputCategory.node.classList.add('error')
                            return
                        }
                        const data = brain.cloneKeyOverlay.getData();
                        onCloneKey(data.key, data.keyName, data.contextName, brain.cloneKeyInputCategory.node.value);
                    });
                }
            },
            createNewProjectInputProject: {
                init: function(node) {
                    this.node = node;
                }
            },
            createNewProjectProjectDescription: {
                init: function(node) {
                    this.node = node;
                }
            },
            createNewProjectSubmit: (function() {
                var node;
                return {
                    init: function(elem) {
                        node = elem;
                        node.addEventListener('click', function() {
                            var projectValue = brain.createNewProjectInputProject.node.value;

                            if (validateNewKey(projectValue)) {
                                // TODO read description field
                                onQueues.createNewProject.forEach(function(fc) {
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
                }
            }()),
            projectShow: {
                init: function(node) {
                    node.addEventListener('click', function() {
                        displayManager.show('translationViewProjectCategoryKey');
                    });
                }
            },
            projectInputCategory: {
                init: function(node) {
                    this.node = node;
                }
            },
            projectInputKey: {
                init: function(node) {
                    this.node = node;
                }
            },
            cancel : (() => {
                return {
                    init : (node) => {
                        node.addEventListener('click', function() {
                            canny.displayManager.hide(this.dataset.view)
                        })
                    }
                }
            })(),
            projectSubmit: (function() {
                var node;
                return {
                    init: function(elem) {
                        node = elem;
                        node.addEventListener('click', function() {
                            var categoryKey = brain.projectInputCategory.node.value,
                                key = brain.projectInputKey.node.value,
                                newKey;

                            if (validateNewKey(categoryKey) && validateNewKey(key)) {
                                // TODO default language
                                newKey = categoryKey + '_' + key;
                                onCreateKey(newKey);
                            } else {
                                // TODO replace with classes
                                brain.projectInputCategory.node.classList.add('error')
                                brain.projectInputKey.node.classList.add('error')
                            }
                        });
                    }
                }
            }())
        },
        fc = {
            /**
             *
             * @returns {{rowPrefix: string, inputPrefix: string, inputTransPrefix: string}}
             */
            get config () {
                return conf;
            },
            enableEditorMode: function(enable) {
                if (enable) {
                    rootNode.classList.add('c-enableEditorMode');
                } else {
                    rootNode.classList.remove('c-enableEditorMode');
                }
            },
            toggleWordCount: function(enable) {
                rootNode.classList.toggle('c-wordCountEnabled', enable);
            },
            sendSuccess: ui.sendSuccess,
            add: function(node, attr) {
                if (attr === 'main') {
                    rootNode = node;
                } else if (brain.hasOwnProperty(attr)) {
                    brain[attr].init(node);
                }
            },
            getViewKeyObject: function(obj) {
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
                    id: obj.key,  // deprecated
                    key: obj.key,
                    contextName: contextName,
                    keyName: newKey.join(delimiter),
                    value: obj.value
                };
            },
            isBundleEqual: function(bundle1, bundle2) {
                if (bundle1.bundle === bundle2.bundle && bundle1.locale === bundle2.locale) {
                    return true;
                }
                return false;
            },
            getBundleNameFrom: function() {

                return {
                    bundle: domOpts.params.bundle || 'messages',
                    locale: this.getFromParam()
                };
            },
            getFromParam: function() {
                return domOpts.params.from || 'de';
            },
            getBundleNameTo: function() {

                return {
                    bundle: domOpts.params.bundle || 'messages',
                    locale: domOpts.params.to || null
                };
            },
            getBundleName: function(locale) {
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
            printBundleTemplate: function(bundles, actualLanguage, availableProjectLanguages, cb) {
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
                                h2.appendChild((function () {
                                    var span = document.createElement('span');
                                    span.appendChild(document.createTextNode(categoryName));
                                    span.className = 'keyName';
                                    return span
                                }()));
                                h2.addEventListener('click', function(event) {
                                    onQueues.categoryClicked.forEach(function(fc) {
                                        fc(categoryNodeId);
                                    });
                                });

                                var editPanel = inputEditManager.addEditorPanel(categoryNode, {
                                    onEdit: function(event) {
                                        event.stopImmediatePropagation();
                                        keyInputNode.removeAttribute('disabled');
                                        contextName = keyInputNode.value;
                                        keyInputNode.focus();
                                    },
                                    onCancel: function(event) {
                                        event.stopImmediatePropagation();
                                        keyInputNode.setAttribute('disabled', 'true');
                                        keyInputNode.value = contextName;
                                    },
                                    onSave: function(event) {
                                        event.stopImmediatePropagation();
                                        onQueues.renameCategory.forEach(function(fc) {
                                            fc({
                                                oldName: contextName,
                                                newName: keyInputNode.value
                                            });
                                        });
                                    },
                                    onDelete: function(event) {
                                        event.stopImmediatePropagation();
                                        var yes = window.confirm('Delete this category?\nAll keys within with will be lost.');
                                        if (yes) {
                                            onQueues.removeCategory.forEach(function(fc) {
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
                                keyInputNode.addEventListener('click', function(event) {
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
                                button.addEventListener('click', function() {
                                    if (validateNewKey(keyNameInput.value)) {
                                        var newKey = keyNameInput.getAttribute('category') + '_' + keyNameInput.value;
                                        // TODO refactor this - server should add the key for all available languages - or pass default lang
                                        onCreateKey(newKey, actualLanguage);
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
                            languages.forEach(function(lang) {
                                countersWrapper.appendChild(createWordCountForLanguage(lang));
                            });
                        }
                        return categoryNode;
                    };

                bundles.forEach(function(data) {
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
            updateCategoryWordCount: function(data) {
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
            addKeyField: function(node, data) {
                var keyInputNode = document.getElementById(conf.inputPrefix + data.key),
                    keyNode;
                if (!keyInputNode) {
                    keyInputNode = domOpts.createElement('input', conf.inputPrefix + data.key, 'keyField');
                    keyNode = domOpts.createElement('div', null, 'data key octicon octicon-key');
                    keyInputNode.setAttribute('disabled', 'true');
                    inputEditManager.addEditorPanel(keyNode, {
                        onDelete: function() {
                            var yes = window.confirm('Delete this key?\nThis key with all translations will removed.');
                            if (yes) {
                                onQueues.removeKey.forEach(function(fc) {
                                    fc({
                                        key: data.key
                                    });
                                });
                            }
                        },
                        onEdit: function() {
                            keyInputNode.removeAttribute('disabled');
                            // save actual key for restoring if cancel
                            data.keyName = keyInputNode.value;
                            // get the key: take id attribute and remove the value from it
                            data.key = keyInputNode.getAttribute('id').replace(conf.inputPrefix, '');
                            data.contextName = data.key.split('_')[0];
                            keyInputNode.focus();
                        },
                        onCancel: function() {
                            keyInputNode.setAttribute('disabled', 'true');
                            keyInputNode.value = data.keyName;
                        },
                        onSave: function() {
                            console.log('translationView:addKeyField save new key');
                            var value = data.contextName ? data.contextName + '_' + keyInputNode.value : keyInputNode.value;
                            if (keyInputNode.value != '' && value != data.key) {
                                onQueues.renameKey.forEach(function(fc) {
                                    fc({
                                        newKey: value,
                                        oldKey: data.key
                                    });
                                });
                            }
                        },
                        onClone: function() {
                            brain.cloneKeyOverlay.setData(data);
                            displayManager.show('translationViewCloneKey');
                        }
                    });
                    // register the input key listener to capture wrong character
                    keyInputNode.addEventListener('keypress', keyKeyPressListener);
                    keyNode.appendChild((function () {
                        var span = document.createElement('span');
                        span.appendChild(document.createTextNode(data.keyName));
                        span.className = 'keyName';
                        return span
                    }()));

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
            addLanguageField: function(node, key, value, lang, wordCount, posIndex) {

                var textNode = document.getElementById(getLanguageTextId(key, lang)),
                    dataNode,
                    wordCountNode,
                    charCountNode,
                    nbspNode,
                    textInformationNode;

                if (!textNode) {
                    textNode = domOpts.createElement('textarea', getLanguageTextId(key, lang), 'textField');
                    dataNode = domOpts.createElement('div', null, 'data tpl js_' + lang);
                    textInformationNode = domOpts.createElement('div', null, 'textInformation');
                    wordCountNode = domOpts.createElement('span', null, 'textInformation-wordCountLabel');
                    charCountNode = domOpts.createElement('span', null, 'textInformation-charCountLabel');
                    wordCountNode.innerHTML = getWordCountText(0);
                    nbspNode = domOpts.createElement('div', null, 'textInformation-nbspSwitch octicon octicon-issue-opened');
                    nbspNode.setAttribute('title', 'There is at least one non-breaking space in this translation. Click to highlight.');

                    textInformationNode.appendChild(flag.getFlag(lang));
                    textInformationNode.appendChild(wordCountNode);
                    textInformationNode.appendChild(nbspNode);
                    textInformationNode.appendChild(charCountNode);

                    nbspNode.addEventListener('click', function () {
                        const start = textNode.value.indexOf('\u00A0');
                        textNode.focus();
                        textNode.setSelectionRange(start, start+1);
                        this.classList.add('active');
                    });

                    textNode.addEventListener('blur', function (event) {
                        nbspNode.classList.remove('active');
                    })

                    textNode.addEventListener('keyup', function () {
                        charCountNode.innerHTML = getCharacterCount(this.value);
                        wordCountNode.innerHTML = getWordCountText(wordCounter.countWordsInString(this.value));
                        if (checkOnNBSP(this.value)) {
                            textNode.parentElement.classList.add('has-nbsp');
                        } else {
                            textNode.parentElement.classList.remove('has-nbsp');
                        }
                    })

                    textNode.setAttribute('type', 'text');

                    new SaveOnLeave(textNode, key, lang, value);

                    dataNode.appendChild(textNode);
                    dataNode.appendChild(textInformationNode);

                    node.insertBefore(
                      dataNode,
                      node.children[posIndex]
                    )
                } else {
                    wordCountNode = textNode.parentElement.querySelector('.textInformation-wordCountLabel');
                    charCountNode = textNode.parentElement.querySelector('.textInformation-charCountLabel');
                    nbspNode = textNode.parentElement.querySelector('.textInformation-nbspSwitch');
                }

                if (value || value === '') {
                    textNode.value = value ? unicode.encode(value) : '';
                    wordCountNode.innerHTML = getWordCountText(wordCounter.countWordsInString(value));
                    charCountNode.innerHTML = getCharacterCount(value);
                    checkOnNBSP(textNode.value) ? textNode.parentElement.classList.add('has-nbsp') : textNode.parentElement.classList.remove('has-nbsp');
                }
            },
            /**
             * creates a row
             * @param {HTMLElement} node
             * @param {string} key
             * @returns {HTMLElement} the existing row or in case if not exists a new created row
             */
            getRow: function(node, key) {
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
                    canny.textEditor.add(catDescNode, {id: key, placeholder: 'Add here the key description'});

                    // add the translation area field container
                    row.appendChild(translationContainer);
                    node.querySelector('.keysWrapper').appendChild(row);
                }
                return row;
            },
            addRowWithLanguages: function(node, data, actualLanguage, allProjectLanguages) {
                var row = fc.getRow(node, data.key);

                fc.addKeyField(row, data);

                allProjectLanguages.forEach(function(lang) {
                    fc.addLanguageField(row.querySelector('.translationContainer'),
                        data.key,
                        actualLanguage === lang ? data.value : null,
                        lang);
                });
            },
            addLanguage: function(keys, lang, posIndex) {
                var row,
                    categories = [],
                    currentCategory;
                keys.forEach(function(key) {
                    row = document.getElementById(conf.rowPrefix + key);
                    if (row) {
                        fc.addLanguageField(
                          row.querySelector(".translationContainer"),
                          key,
                          null,
                          lang,
                          0,
                          posIndex
                        )

                        currentCategory = key.split('_')[0];
                        if (categories.indexOf(currentCategory) === -1) {
                            categories.push(currentCategory);
                        }

                    } else {
                        console.log('translationView:addLanguage found key which is not available in view:', key);
                    }
                });

                categories.forEach(function(category) {
                    const overallWordCount = document.querySelector('#' + conf.rowPrefix + category + ' .overallWordCountWrapper .translationContainer')
                    overallWordCount.appendChild(createWordCountForLanguage(lang))
                });
            },
            clearView: function() {
                // just reset all for now
                // TODO do it better ;)
                [].slice.call(rootNode.children).forEach(function(child) {
                    rootNode.removeChild(child);
                });
            },
            showLang: function(lang) {
                // show the lang tab
                rootNode.classList.remove('c-hide_' + lang);
            },
            /**
             * remove a category
             * TODO it's not called if own user renames a category
             */
            renameCategory: function(oldName, newName, availableProjectLanguages) {
                var categoryNode = document.getElementById(conf.rowPrefix + oldName),
                    rows = categoryNode.querySelectorAll('.c-row'),
                    headline = categoryNode.querySelector('h2'),
                    addKeyNode = categoryNode.querySelector('.addNewKeyrow');

                categoryNode.id = conf.rowPrefix + newName;

                headline.querySelector('.keyName').childNodes[0].nodeValue = newName;

                addKeyNode.querySelector('label').innerHTML = newName + '_';
                addKeyNode.querySelector('input').setAttribute('category', newName);

                [].slice.call(rows).forEach(function(row) {
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
            removeCategory: function(cat) {
                var row = document.getElementById(conf.rowPrefix + cat);
                if (row) {
                    row.domRemove();
                }
            },
            /**
             * show a key as deleted
             * @param key
             */
            markKeyAsRemoved: function(key) {
                var row = document.getElementById(conf.rowPrefix + key),
                    removeIc;
                if (row && !row.classList.contains('c-removed')) {
                    row.classList.add('c-removed');
                    removeIc = domOpts.createElement('div', null, 'remove-button octicon octicon-x');
                    removeIc.addEventListener('click', function() {
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
            removeKey: function(key) {
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
            renameKey: function(oldKey, newKey, availableProjectLanguages) {
                var keyInputNode = document.getElementById(conf.inputPrefix + oldKey),
                    keyName;

                if (keyInputNode) {
                    keyName = fc.getViewKeyObject({key: newKey}).keyName;
                    renameDOMIds(oldKey, newKey, availableProjectLanguages);
                    keyInputNode.value = keyName;
                    // close the edit view
                    inputEditManager.closeEditView(keyInputNode);
                    // disabled the input field
                    keyInputNode.setAttribute('disabled', 'true');
                    keyInputNode.parentNode.querySelector('.keyName').childNodes[0].nodeValue = keyName;
                }
            },
            removeImage: function(categoryName) {
                var imageBox = rootNode.querySelector('#' + conf.rowPrefix + categoryName + ' .imageUpload-imageBox');
                while (imageBox.firstChild) {
                    imageBox.removeChild(imageBox.firstChild);
                }
                imageBox.classList.remove('c-show');
            },
            hideLang: function(lang) {
                rootNode.classList.add('c-hide_' + lang);
            },
            onCreateNewProject: function(cb) {
                onQueues.createNewProject.push(cb);
            },
            onCategoryClicked: function(cb) {
                onQueues.categoryClicked.push(cb);
            },
            onAddNewKey: function(cb) {
                onQueues.addNewKey.push(cb);
            },
            onRenameKey: function(cb) {
                onQueues.renameKey.push(cb);
            },
            onRemoveKey: function(cb) {
                onQueues.removeKey.push(cb);
            },
            onRemoveCategory: function(cb) {
                onQueues.removeCategory.push(cb);
            },
            onRenameCategory: function(cb) {
                onQueues.renameCategory.push(cb);
            },
            /**
             * Set logic for handling saving changes to a key.
             * @param func
             */
            onSaveKey: function(func) {
                onSaveKey = func;
            },
            /**
             * Set logic for handling saving changes to a key.
             * @param func
             */
            onCreateKey: function(func) {
                onCreateKey = func;
            },
            onCloneKey: function(func) {
                onCloneKey = func;
            },
            registerWhisker: function(fc) {
                renderTextFc = fc;
            }
        };
    return fc;
}());

module.exports = translationView;
