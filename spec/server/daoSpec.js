var fixturesDirectory = __dirname + '/fixtures/',
    exec = require('child_process').execSync,
    fs = require('fs'),
    path = require('path');

describe('dao', () => {
    var dao;

    describe('constructor', () => {
    
        const projectFolder = fixturesDirectory + 'valid_project_in_rootfolder';
        const projectJSON = projectFolder + '/project.json'
        
        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});
            done();
        });

        it('should return a new dao instance', function(done) {
            expect(dao).toBeDefined();
            done();
        });
    });

    describe('loadProject', () => {

        const sampleProjectId = '/project1';
        const projectFolder = fixturesDirectory + 'valid_project_in_rootfolder';
        const projectJSON = projectFolder + '/project.json'

        describe('success cases', () => {

            beforeEach((done) => {
                dao = require('../../lib/server/dao')({projectFolder, projectJSON});
                done();
            });

            it('project data is returned', (done) => {
                dao.loadProject(sampleProjectId, (projectData) => {
                    expect(projectData).toBeDefined();
                    expect(projectData.projectId).toBeDefined();
                    expect(projectData.projectId).toEqual(sampleProjectId);
                    expect(projectData.project).toEqual('project1');
                    expect(projectData.defaultLanguage).toEqual('en');
                    done();
                });
            });

            it("sample keys are present", (done) => {
                dao.loadProject(sampleProjectId, (projectData) => {
                    expect(Object.keys(projectData.keys.de).length).toEqual(2);
                    expect(projectData.keys.de.first_key_1).toEqual('test Schluessel Nummer Eins');
                    expect(projectData.keys.de.first_key_2).toEqual('test Schluessel Nummer Zwei');

                    expect(Object.keys(projectData.keys.en).length).toEqual(3);
                    expect(projectData.keys.en.first_key_1).toEqual('test key number one');
                    expect(projectData.keys.en.first_key_2).toEqual('test key number two');
                    expect(projectData.keys.en.first_key_3).toEqual('test key number three');

                    done();
                });
            });

            it('sample key descriptions are present', (done) => {
                dao.loadProject(sampleProjectId, (projectData) => {
                    expect(projectData.keyDescriptions).toBeDefined();
                    done();
                });
            });
        });

        describe('error cases', () => {

            
            describe('nonexisting project', () => {
                const projectFolder = fixturesDirectory + 'valid_project_in_rootfolder';
                const projectJSON = projectFolder + '/project.json'
                
                beforeEach((done) => {
                    dao = require('../../lib/server/dao')({projectFolder, projectJSON});
                    done();
                });
                
                afterAll(done => fs.unlink(projectJSON, done))

                it('should not choke on it', (done) => {
                    dao.loadProject('/noneExistingProject', (projectData) => {
                        expect(projectData).toBeFalsy();
                        done();
                    });
                });
            });

            describe('malformed project file', () => {
                const projectFolder = fixturesDirectory + 'invalid_project_in_rootfolder';
                const projectJSON = projectFolder + '/project.json'
                
                beforeEach((done) => {
                    dao = require('../../lib/server/dao')({projectFolder, projectJSON});
                    done();
                });
    
                afterAll(done => fs.unlink(projectJSON, done))

                it('should not choke on it', (done) => {
                    dao.loadProject('/invalid_project.prj', (cbValue) => {
                        expect(cbValue).toBeFalsy();
                        done();
                    });
                });

            });
        });
    });

    describe('getDirectory', () => {
        const projectFolder = fixturesDirectory + 'valid_projects_in_subfolder';
        const projectJSON = projectFolder + '/project.json'

        // create an empty folder
        beforeAll((done) => {
            fs.mkdir(projectFolder + '/subFolder/emptySubFolder', done)
        });

        afterAll((done) => {
            fs.rmdir(projectFolder + '/subFolder/emptySubFolder', done)
            fs.unlink(projectJSON, err => err !== null ? console.log(err) : undefined)
        });

        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});
            done();
        });

        it("should return the sub projects from /", (done) => {
            dao.getDirectory("/", (obj) => {
                expect(obj.projects.length).toEqual(1);
                expect(obj.projects).toEqual([{
                    name: 'project1',
                    id: '/project1'
                }]);
                done();
            });
        });

        it("should return the sub directories from /", (done) => {
            dao.getDirectory("/", (obj) => {
                expect(obj.dirs.length).toEqual(1);
                expect(obj.dirs).toEqual([{
                    name: 'subFolder',
                    id: '/subFolder'
                }]);
                done();
            });
        });

        it("should return the contents from sub folder", (done) => {
            dao.getDirectory("/subFolder", (obj) => {
                expect(obj.projects.length).toEqual(1);
                expect(obj.projects).toEqual([{
                    name: 'project2',
                    id: '/subFolder/project2'
                }]);
                expect(obj.parentDirectory).toEqual('/');
                expect(obj.currentDirectory).toEqual('/subFolder');
                expect(obj.dirs).toEqual([{
                    name: 'emptySubFolder',
                    id: '/subFolder/emptySubFolder'
                }, {
                    name: 'subSubFolder',
                    id: '/subFolder/subSubFolder'
                }]);
                done();
            });
        });

        it("should return false if path does not exists", (done) => {
            dao.getDirectory("/noneExistingPath", (obj) => {
                expect(obj).toBeFalsy();
                done();
            });
        });

        it('should return itself as the parent directory if already at top level', (done) => {
            dao.getDirectory("/", (obj) => {
                expect(obj.parentDirectory).toEqual('/');
                expect(obj.currentDirectory).toEqual('/');
                done();
            });
        });

        it('should return the correct parent directory if there is a parent', (done) => {
            dao.getDirectory("/subFolder", (obj) => {
                expect(obj.parentDirectory).toEqual('/');
                expect(obj.currentDirectory).toEqual('/subFolder');
                done();
            });
        });

        it('should return the correct parent directory from a sub sub directory', (done) => {
            dao.getDirectory("/subFolder/subSubFolder", (obj) => {
                expect(obj.parentDirectory).toEqual('/subFolder');
                expect(obj.currentDirectory).toEqual('/subFolder/subSubFolder');
                done();
            });
        });

        it('should have expected IDs', (done) => {
            dao.getDirectory('/', (obj) => {
                console.log('daoSpec:obj.projects', obj.projects);
                expect(obj.projects.length).toEqual(1);
                expect(obj.projects[0].id).toEqual('/project1');
                done();
            });
        });

        it('should return empty lists if a directory has no items', (done) => {
            dao.getDirectory('/subFolder/emptySubFolder', (obj) => {
                expect(obj.projects.length).toEqual(0);
                expect(obj.dirs.length).toEqual(0);
                done();
            });
        });

        it('should have parent directories wit correct name', (done) => {
            dao.getDirectory('/subFolder/emptySubFolder', (obj) => {
                expect(obj.parentDirectories[0].name).toEqual('');
                expect(obj.parentDirectories[1].name).toEqual('subFolder');
                expect(obj.parentDirectories[2].name).toEqual('emptySubFolder');
                done();
            });
        });

        it('should have parent directories wit correct id', (done) => {
            dao.getDirectory('/subFolder/emptySubFolder', (obj) => {
                expect(obj.parentDirectories[0].id).toEqual('/');
                expect(obj.parentDirectories[1].id).toEqual('/subFolder');
                expect(obj.parentDirectories[2].id).toEqual('/subFolder/emptySubFolder');
                done();
            });
        });
    });

    describe('createNewProject', () => {
        const projectFolder = fixturesDirectory + 'empty_rootfolder/'
        const directory = '/'
        const projectName = 'newProject'
        const projectJSON = projectFolder + '/project.json'

        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});
            done();
        });

        afterEach((done) => {
            fs.unlink(projectJSON, err => err !== null ? console.log(err) : undefined)
            fs.unlink(projectFolder + projectName + '.json', (err) => {
                expect(err).toBeFalsy();
                done();
            });
        });

        it('should create a new project with expected defaults', (done) => {
            dao.createNewProject(directory, projectName, {}, (err, projectData) => {
                expect(err).toBeFalsy();
                expect(projectData).toBeTruthy();
                expect(projectData).toBeDefined();
                expect(projectData.projectId).toEqual('/' + projectName);
                expect(projectData.project).toEqual(projectName);
                expect(projectData.description).toEqual('');
                expect(projectData.languages).toEqual({});
                expect(projectData.availableLanguages.length).toEqual(8);
                expect(projectData.keyDescriptions).toEqual({__description: ''});
                expect(projectData.numberOfKeys).toEqual(0);
                expect(projectData.keys).toEqual({});
                done();
            });
        });

        it('should save json file for new project', (done) => {
            dao.createNewProject(directory, projectName, {}, (err, projectData) => {
                var expectedProjectPath = projectFolder + '/' + directory + '/' + projectName + '.json';
                fs.stat(expectedProjectPath, (err, stats) => {
                    expect(err).toBeFalsy();
                    expect(stats.isFile()).toBeTruthy();

                    dao.loadProject(directory + projectName, (projectData) => {
                        expect(projectData).toBeDefined();
                        expect(projectData.projectId).toEqual('/newProject');
                        done();
                    });
                });
            });
        });

        it('should include a given project description in the created config', (done) => {
            var description = "My special description";
            dao.createNewProject(directory, projectName, {description: description}, (err, projectData) => {
                expect(err).toBeFalsy();
                expect(projectData.description).toEqual(description);
                done();
            });
        });
    });

    describe('createNewDirectory', () => {
        const projectFolder = fixturesDirectory + 'valid_projects_in_subfolder';
        const projectJSON = projectFolder + '/project.json'
        const subDirectoryName = 'newDirectory';
        
        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});
            done();
        });

        afterEach((done) => {
            fs.rmdir(projectFolder + '/' + subDirectoryName, done)
            fs.unlink(projectJSON, err => err !== null ? console.log(err) : undefined)
        });

        it('should fail if the parent directory does not exist', (done) => {
            // TODO how to add an assert that the parent really does not exist?
            dao.createNewDirectory(subDirectoryName, 'nonexistingDirectory', (err, directoryData) => {
                expect(err).toBeTruthy();
                expect(directoryData).toBeUndefined();
                done();
            });
        });

        it('should fail if the directory to create exists already ', (done) => {
            dao.createNewDirectory('subFolder', '/', (err, directoryData) => {
                expect(err).toBeTruthy();
                expect(directoryData).toBeFalsy();
                done();
            });
        });

        it('should create the new directory if all preconditions are met ', (done) => {
            dao.createNewDirectory(subDirectoryName, '/', (err, directoryData) => {
                expect(err).toBeFalsy();
                expect(directoryData).toBeDefined();
                expect(directoryData.directoryId).toEqual('/' + subDirectoryName);
                expect(directoryData.parentDirectoryId).toEqual('/');
                expect(fs.existsSync(path.normalize(projectFolder + '/' + directoryData.directoryId))).toEqual(true);
                done();
            });
        });
    });

    describe('saveKey', () => {
        const projectFolder = fixturesDirectory + 'empty_rootfolder/';
        const projectId = '/newProject';
        const language = 'de';
        const keyName = 'key_1';
        const projectJSON = projectFolder + '/project.json'

        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});

            dao.createNewProject('/', 'newProject', {}, (err, projectData) => {
                expect(err).toBeFalsy();
                done();
            });
        });

        afterEach((done) => {
            fs.unlink(projectJSON, err => err !== null ? console.log(err) : undefined)
            fs.unlink(projectFolder + projectId + '.json', (err) => {
                expect(err).toBeFalsy();
                done();
            });
        });

        describe('new keys', () => {
            it('should save new key in project file', (done) => {
                var keyValue = 'test text DE';
                var change = {key: keyName, value: keyValue};
                dao.saveKey(projectId, language, change, (err, savedKey, savedValue) => {
                    expect(err).toBeFalsy();
                    dao.loadProject(projectId, (projectData) => {
                        expect(projectData.keys[language]).toBeDefined();
                        expect(projectData.keys[language][keyName]).toBeDefined();
                        expect(projectData.keys[language][keyName]).toEqual(keyValue);
                        done();
                    });
                });
            });

            it('should return saved key', (done) => {
                var keyValue = 'test text DE';
                var change = {key: keyName, value: keyValue};
                dao.saveKey(projectId, language, change, (err, savedKeyName, savedKeyValue) => {
                    expect(err).toBeFalsy();
                    expect(savedKeyName).toEqual(keyName);
                    expect(savedKeyValue).toEqual(keyValue);
                    done();
                });
            });
        });

        describe('existing keys', () => {
            var keyOldValue = 'test text DE';
            var keyNewValue = 'test text DE_changed';

            beforeAll((done) => {
                dao.saveKey(projectId, language, {key: keyName, value: keyOldValue}, (savedKeyName, savedKeyValue) => {
                    done();
                });
            });

            it('should still have key in project after update', (done) => {
                var change = {key: keyName, value: keyNewValue};
                dao.saveKey(projectId, language, change, (err, savedKeyName, savedKeyValue) => {
                    expect(err).toBeFalsy();
                    dao.loadProject(projectId, (projectData) => {
                        expect(projectData.keys[language][keyName]).toBeDefined();
                        done();
                    });
                });
            });

            it('should have changed the key to the new value', (done) => {
                var change = {key: keyName, value: keyNewValue};
                dao.saveKey(projectId, language, change, (err, savedKeyName, savedKeyValue) => {
                    expect(err).toBeFalsy();
                    dao.loadProject(projectId, (projectData) => {
                        expect(projectData.keys[language][keyName]).toEqual(keyNewValue);
                        done();
                    });
                });
            });

        });
    });

    describe('removeKey', () => {
        const projectFolder = fixturesDirectory + 'empty_rootfolder/'
        const projectJSON = projectFolder + '/project.json'
        const projectId = '/newProject'
        const languageDE = 'de'
        const languageEN = 'en'
        const keyName = 'key_1'
        const keyValueDE = 'test text DE'
        const keyValueEN = 'test text EN'

        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});

            dao.createNewProject('/', 'newProject', {}, (err, projectData) => {
                expect(err).toBeFalsy();
                dao.saveKey(projectId, languageDE, {key: keyName, value: keyValueDE}, () => {
                    dao.saveKey(projectId, languageEN, {key: keyName, value: keyValueEN}, () => {
                        done();
                    })
                });
            });
        });

        afterEach((done) => {
            fs.unlink(projectJSON, err => err !== null ? console.log(err) : undefined)
            fs.unlink(projectFolder + 'newProject.json', (err) => {
                expect(err).toBeFalsy();
                done();
            })
        });

        it('should have removed all entries of the key', (done) => {
            dao.removeKey(projectId, keyName, (deletedKeyName) => {
                dao.loadProject(projectId, (projectData) => {
                    expect(projectData.keys[languageDE][keyName]).toBeUndefined();
                    expect(projectData.keys[languageEN][keyName]).toBeUndefined();
                    done();
                });
            });
        });
    });

    describe('renameKey', () => {
        const projectFolder = fixturesDirectory + 'empty_rootfolder/';
        const projectJSON = projectFolder + '/project.json'
        const projectId = '/newProject';
        const languageDE = 'de';
        const languageEN = 'en';
        const keyOldName = 'key_1';
        const keyNewName = 'key_1_changed';
        const keyValueDE = 'test text DE';
    
        const keyValueEN = 'test text EN';
        const keyRename = {oldKey: keyOldName, newKey: keyNewName};

        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});
            dao.createNewProject('/', 'newProject', {}, (err, projectData) => {
                expect(err).toBeFalsy();
                dao.saveKey(projectId, languageDE, {key: keyOldName, value: keyValueDE}, () => {
                    dao.saveKey(projectId, languageEN, {key: keyOldName, value: keyValueEN}, () => {
                        done();
                    })
                });
            });
        });

        afterEach((done) => {
            fs.unlink(projectJSON, err => err !== null ? console.log(err) : undefined)
            fs.unlink(projectFolder + 'newProject.json', (err) => {
                expect(err).toBeFalsy();
                done();
            })
        });

        it('should have removed entry with old key name', (done) => {
            dao.renameKey(projectId, keyRename, (err, oldKeyName, newKeyName) => {
                expect(err).toBeFalsy();
                dao.loadProject(projectId, (projectData) => {
                    expect(projectData.keys[languageDE][keyOldName]).toBeUndefined();
                    expect(projectData.keys[languageEN][keyOldName]).toBeUndefined();
                    done();
                });
            });
        });

        it('should have changed occurrences of the key for all languages', (done) => {
            dao.renameKey(projectId, keyRename, (err, oldKeyName, newKeyName) => {
                expect(err).toBeFalsy();
                dao.loadProject(projectId, (projectData) => {
                    expect(projectData.keys[languageDE][keyNewName]).toBeDefined();
                    expect(projectData.keys[languageEN][keyNewName]).toBeDefined();
                    done();
                });
            });
        });

        it('should not have changed the key value', (done) => {
            dao.renameKey(projectId, keyRename, (err, oldKeyName, newKeyName) => {
                expect(err).toBeFalsy();
                dao.loadProject(projectId, (projectData) => {
                    expect(projectData.keys[languageDE][keyNewName]).toEqual(keyValueDE);
                    expect(projectData.keys[languageEN][keyNewName]).toEqual(keyValueEN);
                    done();
                });
            });
        });

        it('should return old and new key name with callback', (done) => {
            dao.renameKey(projectId, keyRename, (err, oldKeyName, newKeyName) => {
                expect(err).toBeFalsy();
                expect(oldKeyName).toEqual(keyOldName);
                expect(newKeyName).toEqual(keyNewName);
                done();
            });
        });

        // TODO add missing tests for renaming key in descriptions property
    });

    describe('saveDescription', () => {
        const projectFolder = fixturesDirectory + 'empty_rootfolder';
        const projectJSON = projectFolder + '/project.json'
        const folder = '/';
        const projectName = 'testProject_saveDescription';
    
        let projectId;

        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});
            done();
        });

        afterEach((done) => {
            fs.unlink(projectJSON, err => err !== null ? console.log(err) : undefined)
            fs.unlink(projectFolder + folder + projectName + '.json', (err) => {
                expect(err).toBeFalsy();
                done();
            });
        });

        describe('with no existing description', () => {

            beforeEach((done) => {
                dao.createNewProject(folder, projectName, {}, (err, projectData) => {
                    expect(err).toBeFalsy();
                    expect(projectData).toBeDefined();
                    projectId = projectData.projectId;
                    done();
                });
            });

            it('should save description if project had none before', (done) => {
                var id = '__description';
                var description = 'testdescription';
                dao.saveProjectDescription(projectId, id, description, (err) => {
                    expect(err).toBeFalsy();
                    dao.loadProject(projectId, (projectData) => {
                        expect(projectData.keyDescriptions[id]).toEqual(description);
                        done();
                    });
                });
            });

        });

        describe('with existing description', () => {

            var initialDescription = 'initialDescription';
            var projectInitialValues = {
                description: initialDescription
            };

            beforeEach((done) => {
                dao.createNewProject(folder, projectName, projectInitialValues, (err, projectData) => {
                    expect(err).toBeFalsy();
                    expect(projectData).toBeDefined();
                    projectId = projectData.projectId;
                    done();
                });
            });

            it('should save description if project had one before', (done) => {
                var id = '__description';
                var description = 'new_description';
                dao.saveProjectDescription(projectId, id, description, (err) => {
                    expect(err).toBeFalsy();
                    dao.loadProject(projectId, (projectData) => {
                        expect(projectData.keyDescriptions[id]).toEqual(description);
                        done();
                    });
                });
            });
        });
    });

    describe('importJSON', () => {
        const projectFolder = fixturesDirectory + 'empty_rootfolder'
        const folder = '/'
        const projectName = 'testProject_importJSON'
        let projectId
    
        const projectJSON = projectFolder + '/project.json'

        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});
            done();
        });

        afterEach((done) => {
            fs.unlink(projectFolder + folder + projectName + '.json', (err) => {
                expect(err).toBeFalsy();
                done();
            });
        });
        
        afterAll((done) => fs.unlink(projectJSON, done))

        describe('', () => {
            var projectInitialValues = {
                description: 'initialDescription'
            };

            beforeEach((done) => {
                dao.createNewProject(folder, projectName, projectInitialValues, (err, projectData) => {
                    expect(err).toBeFalsy();
                    expect(projectData).toBeDefined();
                    projectId = projectData.projectId;
                    done();
                });
            });

            it("should add valid JSON data to current project's keys", (done) => {

                var importData = {
                    "en": {
                        "category_headline": "categoryHeadline",
                        "anotherCategory_headline": "anotherCategoryHeadline"
                    },
                    "de": {
                        "category_headline": "ueberschrift_kategorie",
                        "anotherCategory_headline": "ueberschrift_kategorie"
                    }
                };

                dao.importJSON(projectId, importData, (err, prjId, prjData) => {
                    expect(err).toBeFalsy();
                    expect(prjData).toBeDefined();
                    expect(prjId).toMatch(projectId);

                    for (var lang in importData) {
                        if (importData.hasOwnProperty(lang)) {
                            expect(prjData.keys[lang]).toBeDefined();
                            for (var key in importData[lang]) {
                                if (importData[lang].hasOwnProperty(key)) {
                                    expect(prjData.keys[lang][key]).toMatch(importData[lang][key]);
                                }
                            }
                        }
                    }
                    done();
                });
            });

            it("should not break or mess up existing keys on receiving totally unrelated JSON data", (done) => {

                var importData = {
                    "project": "projectName",
                    "randomData": {
                        "headline": "categoryHeadline",
                        "subline": "anotherCategoryHeadline",
                        "randomChild": {
                            "content": "Lorem ipsum dolor est"
                        }
                    }
                };

                dao.importJSON(projectId, importData, (err, prjId, prjData) => {
                    expect(prjData.keys).toEqual({});
                    done();
                });
            });

            it("should not mess up project on receiving corrupt translation keys", (done) => {

                var importData = {
                    "en": {
                        "headline": "Not a category headline."
                    }
                };

                dao.importJSON(projectId, importData, (err, prjId, prjData) => {
                    expect(err).toBeDefined();
                    expect(err instanceof TypeError).toBeTruthy();
                    done();
                });
            });

            it("should be able to import json storing category data in objects for each category", (done) => {

                var importData = {
                    "en": {
                        "category": {
                            "headline": "Category headline."
                        }
                    }
                };

                dao.importJSON(projectId, importData, (err, prjId, prjData) => {
                    expect(err).toBeFalsy();
                    expect(prjData).toBeDefined();
                    expect(prjId).toMatch(projectId);
                    expect(prjData.keys.en.category_headline).toBe(importData.en.category.headline);
                    done();
                });
            });
        });
    });

    describe('removeCategory', () => {
        const projectFolder = fixturesDirectory
        const projectJSON = projectFolder + '/project.json'
        const projectName = 'removeCategoryTest'
        const projectId = '/' + projectName
        const keys = {
            "en": {
                "category01_key01": "0101 text EN",
                "category01_key02": "0102 text EN",
                "category02_key01": "0201 text EN"
            },
            "de": {
                "category01_key01": "0101 text DE",
                "category01_key02": "0102 text DE",
                "category02_key01": "0201 text DE"
            }
        }
        const categoryToDelete = 'category01'

        beforeEach((done) => {
            dao = require('../../lib/server/dao')({projectFolder, projectJSON})

            dao.createNewProject('/', projectName, {}, (err, projectData) => {
                expect(err).toBeFalsy()
                dao.importJSON(projectName, keys, (err, projectId, projectData) => {
                    expect(projectData.keys).toEqual(keys)
                    done()
                });
            });
        });

        afterEach((done) => {
            fs.unlink(projectFolder + projectName + '.json', (err) => {
                expect(err).toBeFalsy()
                done()
            });
        });
    
        afterAll((done) => fs.unlink(projectJSON, done))

        it('should have removed all contained keys', (done) => {
            dao.removeCategory(projectName, categoryToDelete, (err, deletedCatName) => {
                expect(err).toBeFalsy();
                expect(deletedCatName).toMatch(categoryToDelete);
                dao.loadProject(projectId, (projectData) => {
                    expect(projectData.keys['en']['category01_key01']).toBeUndefined();
                    expect(projectData.keys['de']['category01_key01']).toBeUndefined();
                    expect(projectData.keys['de']['category01_key02']).toBeUndefined();
                    expect(projectData.keys['de']['category01_key02']).toBeUndefined();
                    expect(projectData.keys['en']['category02_key01']).toEqual(keys['en']['category02_key01']);
                    expect(projectData.keys['de']['category02_key01']).toEqual(keys['de']['category02_key01']);
                    done();
                });
            });
        });
    });

    describe('key descriptions should always be updated, ', () => {
        const projectFolder = fixturesDirectory + 'key_descriptions'
        const tempFolder = 'temp'
        const projectName = 'project1'
        const projectId = `/${projectName}`
        const projectJSON = `${projectFolder}/${tempFolder}/project.json`

        beforeEach((done) => {
            // Create temp folder and clone project-template into it
            exec(`mkdir ${projectFolder}/${tempFolder}`);
            exec(`cp ${projectFolder}/${projectName}.json ${projectFolder}/${tempFolder}/${projectName}.json`);
            dao = require('../../lib/server/dao')({projectFolder : `${projectFolder}/${tempFolder}`, projectJSON});
            done();
        });

        afterEach((done) => {
            // Delete temp folder and project
            exec(`rm -rf ${projectFolder}/${tempFolder}`);
            done();
        });
        
        afterAll((done) => fs.unlink(projectJSON, done))

        it('so when user deletes a key it´s description (if present) should be deleted too', (done) => {
            dao.loadProject(projectId, (data) => {
                // See fixtures/keys_descriptions/project1.json for keys
                dao.removeKey(projectId, 'first_key_1', (err, keyName) => {
                    expect(err).toBeNull();
                    expect(keyName).toBeDefined();
                    expect(keyName).toBe('first_key_1');

                    dao.loadProject(projectId, (prjData) => {
                        expect(prjData.keyDescriptions.hasOwnProperty(keyName)).toBe(false);
                        done();
                    });
                });
            });
        });

        it('so when user deletes a key without associated description the app should not crash', (done) => {
            dao.loadProject(projectId, (data) => {
                // project1.json does not have a key description for 'first_key_2'
                dao.removeKey(projectId, 'first_key_2', (err, keyName) => {
                    expect(err).toBeNull();
                    expect(keyName).toBeDefined();
                    expect(keyName).toBe('first_key_2');

                    dao.loadProject(projectId, (prjData) => {
                        // Verify that loading the project does not result in errors (i.e. prjData === false)
                        expect(prjData).toBeTruthy();
                        done();
                    });
                });
            });
        });

        it('so when user renames a key it´s description should be referenced by that name too', (done) => {
            dao.loadProject(projectId, (data) => {
                var testData = {
                        sourceKey: 'first_key_1',
                        targetKey: 'renamed_key_1'
                    },
                    descValue = data.keyDescriptions[testData.sourceKey];

                expect(descValue).toBeDefined();
                // See fixtures/key_descriptions/project1.json
                expect(descValue).toBe('Description for key_1 of category first');

                dao.renameKey(projectId, {
                    oldKey: testData.sourceKey,
                    newKey: testData.targetKey
                }, (err, oldName, newName) => {
                    expect(err).toBeNull();
                    expect(oldName).toBe(testData.sourceKey);
                    expect(newName).toBe(testData.targetKey);

                    dao.loadProject(projectId, (prjData) => {
                        // Verify that old key was deleted from keyDescriptions
                        expect(prjData.keyDescriptions.hasOwnProperty(testData.sourceKey)).toBe(false);
                        // Verify that new key was added to keyDescriptions
                        expect(prjData.keyDescriptions.hasOwnProperty(testData.targetKey)).toBe(true);
                        // Verify that value from source key descriptions was transferred to newly created key description
                        expect(prjData.keyDescriptions[testData.targetKey]).toBe(descValue);
                        done();
                    });
                });

            });
        });

        it('so when user clones a key into another category ', (done) => {
            dao.loadProject(projectId, (data) => {
                var testData = {
                    id: 'first_key_1',
                    key: 'key_1',
                    sourceCategory: 'first',
                    targetCategory: 'newCategory'
                };

                dao.cloneKey(projectId, testData, (err, projectId, result) => {
                    expect(err).toBeNull();

                    // Check result data passed into callback
                    expect(result.keyDescriptions.hasOwnProperty(`${testData.sourceCategory}_${testData.key}`)).toBe(true);
                    expect(result.keyDescriptions.hasOwnProperty(`${testData.targetCategory}_${testData.key}`)).toBe(true);
                    expect(result.keyDescriptions[`${testData.targetCategory}_${testData.key}`]).toBe(result.keyDescriptions[`${testData.sourceCategory}_${testData.key}`]);

                    // Check whether data has been stored correctly
                    dao.loadProject(projectId, (prjData) => {
                        // Check whether key descriptions has been copied
                        expect(prjData.keyDescriptions.hasOwnProperty(`${testData.sourceCategory}_${testData.key}`)).toBe(true);
                        expect(prjData.keyDescriptions.hasOwnProperty(`${testData.targetCategory}_${testData.key}`)).toBe(true);
                        // Check whether values of source and target description are the same
                        expect(prjData.keyDescriptions[`${testData.targetCategory}_${testData.key}`]).toBe(prjData.keyDescriptions[`${testData.sourceCategory}_${testData.key}`]);
                        done();
                    });
                });
            });
        });

        it('so when user removes a category all key related descriptions should be deleted', (done) => {
            dao.loadProject(projectId, (data) => {
                var categoryToDelete = 'second';
                dao.removeCategory(projectId, categoryToDelete, (err, categoryName) => {
                    expect(err).toBeNull();
                    expect(categoryName).toBe(categoryToDelete);

                    dao.loadProject(projectId, (prjData) => {
                        Object.keys(prjData.keyDescriptions).forEach(item => {
                            var prefix = item.split('_').shift();
                            expect(prefix).not.toEqual(categoryToDelete);
                        });
                        done();
                    });
                });
            });
        });

        it('so when user renames a category all child keys should be renamed as well', (done) => {
            dao.loadProject(projectId, (data) => {
                var testData = {
                        origCatName: 'second',
                        origCatDesc: data.keyDescriptions['second'],
                        renamedCatName: 'renamedCategory'
                    },
                    origCatKeyCount = 0;

                // Count key descriptions associated with the category to be renamed
                Object.keys(data.keyDescriptions).forEach(item => {
                    var prefix = item.split('_').shift();
                    if (prefix === testData.origCatName) {
                        origCatKeyCount++;
                    }
                });

                dao.renameCategory(projectId, testData.origCatName, testData.renamedCatName, (err, oldName, newName) => {
                    expect(err).toBeNull();
                    dao.loadProject(projectId, (prjData) => {
                        var renamedCatKeyCount = 0;
                        expect(prjData).toBeTruthy();
                        // Verify that description value has been taken over
                        expect(prjData.keyDescriptions[testData.renamedCatName]).toBe(testData.origCatDesc);

                        Object.keys(prjData.keyDescriptions).forEach(item => {
                            var prefix = item.split('_').shift();
                            // Verify that original key descriptions were wiped out
                            expect(prefix).not.toEqual(testData.origCatName);

                            // Count number of renamed category's descriptions
                            if (prefix === testData.renamedCatName) {
                                renamedCatKeyCount++;
                            }
                        });
                        // Verify that no key description was lost during renaming
                        expect(renamedCatKeyCount).toBe(origCatKeyCount);
                        done();
                    });
                });
            });
        });
    });

    describe('deleteProject', () => {
        const projectFolder = fixturesDirectory + 'project_deletion'
        const tempFolder = 'temp'
        const projectName = 'project1'
        const projectJSON = projectFolder + '/project.json'
        
        beforeEach((done) => {
            // Create temp folder and clone project-template into it
            exec(`mkdir ${projectFolder}/${tempFolder}`)
            exec(`cp ${projectFolder}/${projectName}.json ${projectFolder}/${tempFolder}/${projectName}.json`)
            dao = require('../../lib/server/dao')({projectFolder, projectJSON})
            done()
        });

        afterEach((done) => {
            // Delete temp folder and project
            exec(`rm -rf ${projectFolder}/${tempFolder}`)
            done()
        });
        
        afterAll((done) => fs.unlink(projectJSON, done))

        it('should delete an existent project from file server', (done) => {
            dao.deleteProject('/' + tempFolder, projectName, (err, prjName) => {
                expect(err).toBeNull()
                expect(prjName).toMatch(projectName)
                done()
            });
        });

        it('should return an error message in case project does not exist on file server', (done) => {
            dao.deleteProject('/' + tempFolder, 'fantasyProject', (err, prjName) => {
                expect(err).toBeDefined()
                expect(err.message).toMatch('ENOENT: no such file or directory')
                expect(prjName).toBeUndefined()
                done()
            });
        });

    });

    describe('deleteFolder', () => {
        const projectFolder = fixturesDirectory + 'folder_deletion'
        const tempFolder = 'temp'
        const projectJSON = projectFolder + '/project.json'
    
    
        beforeEach((done) => {
            // Create temp folder and clone project-template into it
            exec(`rsync -a ${projectFolder}/** ${projectFolder}/${tempFolder}`);
            exec(`mkdir ${projectFolder}/${tempFolder}/empty_folder`);
            dao = require('../../lib/server/dao')({projectFolder, projectJSON});
            done();
        });

        afterEach((done) => {
            // Delete temp folder and project
            exec(`rm -rf ${projectFolder}/${tempFolder}`);
            done();
        });
    
        afterAll((done) => fs.unlink(projectJSON, done))

        it('should delete an existent empty folder from file server', (done) => {
            dao.deleteFolder('/' + tempFolder, 'empty_folder', (err, dirName) => {
                expect(err).toBeNull();
                expect(dirName).toMatch('empty_folder');
                done();
            });
        });

        it('should return an error message in case folder does not exist on file server', (done) => {
            dao.deleteFolder('/' + tempFolder, 'non_existent_folder', (err, dirName) => {
                expect(err).toBeDefined();
                expect(err.code).toBe('ENOENT');
                expect(err.message).toMatch('no such file or directory');
                expect(dirName).toBeUndefined();
                done();
            });
        });

        it('should return an error message in case folder is not empty', (done) => {
            dao.deleteFolder('/' + tempFolder, 'project_folder', (err, dirName) => {
                expect(err).toBeDefined();
                expect(err.code).toBe('ENOTEMPTY');
                expect(err.message).toMatch('directory not empty');
                expect(dirName).toBeUndefined();
                done();
            });
        });

    });
});

