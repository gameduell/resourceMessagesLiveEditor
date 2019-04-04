var projectOverview = require('canny').projectOverview,
    displayManager = require('canny').displayManager,
    trade = require('../trade.js'),
    uiEvents = require('../uiEventManager.js'),
    toast = require('../Toast.js'),
    events = require('../events.js');

const moveProject = require('./moveProjectComponent')

var projectOverviewController = (function() {

    var currentParentDirectory,
        currentDirectory,
        /**
         * Maps project names to projects IDs
         */
        projects,
        /**
         * Maps directory names to directory IDs
         */
        directories;

    uiEvents.addUiEventListener({
        showOverviewPage : function () {
            displayManager.show('projectsOverview');
        }
    });

    projectOverview.onParentDirectorySelected(function() {
        if (currentParentDirectory !== currentDirectory) {
            trade.getDirectory(currentParentDirectory);
        } else {
            console.log('No parent directory');
        }
    });

    projectOverview.onProjectSelected(function(projectName) {
        uiEvents.callUievent('projectSelected', projects[projectName].id);
    });

    projectOverview.onDirectorySelected(function(directoryName) {
        var directoryId = directories[directoryName];
        trade.getDirectory(directoryId, function () {
            console.log('projectOverviewController:can not load project for directory name:', directoryId);
        });
    });

    projectOverview.onCreateProjectPressed(function() {
        displayManager.show('createNewProjectView');
    });

    projectOverview.onCreateDirectoryPressed(function() {
        displayManager.show('createNewDirectoryView');
    });

    projectOverview.onDeleteFolderPressed(function(dirName) {
        let directoryname = currentDirectory
        if (directoryname[directoryname.length - 1] !== '/') {
            directoryname += '/';
        }
        trade.deleteFolder(directoryname + dirName, function(err, dirName) {
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
    
    projectOverview.onMoveDirectoryPressed(projectName => moveProject.show(projects[projectName]))

    projectOverview.onDeleteProjectPressed(function(projectName) {
        trade.deleteProject(projects[projectName].id, function(err, project) {
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
        getDirectory: function (data) {
            console.log('ProjectOverviewController.getDirectory: ', data);
            if (data === false) {
                console.error("Server call failed");
            } else if (data.hasOwnProperty('projects') && data.hasOwnProperty('dirs')) {

                projects = {};
                data.projects.forEach(function(entry) {
                    projects[entry.name] = entry;
                });

                directories = {};
                data.dirs.forEach(function(entry) {
                   directories[entry.name] = entry.id;
                });

                projectOverview.setProjectsAndDirectories(Object.keys(projects), Object.keys(directories));
                currentParentDirectory = data.parentDirectory;
                currentDirectory = data.currentDirectory;

            } else {
                console.warn('Data rcvd from server is missing expected properties ("projects", "dirs")');
            }
        },
        onNewDirectoryCreated : function(data) {
            displayManager.show('projectsOverview');
            trade.getDirectory(data.directoryId, function() {
                console.log('projectOverviewController.onNewDirectoryCreated: trade callback');
            });
        }
    };
})();

module.exports = projectOverviewController;
