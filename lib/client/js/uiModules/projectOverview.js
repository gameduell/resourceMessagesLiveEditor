var projectOverview = (function() {
    'use strict';

    var componentRootNode,
        renderProjectsAndDirectoriesList,
        onCreateProjectPressed = function() { console.warn('projectOverview.onCreateProjectPressed not set')},
        onParentDirectorySelected = function() {console.warn('projectOverview.onParentDirectorySelected not set')},
        onProjectSelected = function() { console.warn('projectOverview.onProjectSelected not set')},
        onDeleteProjectPressed = function() { console.warn('projectOverview.onDeleteProjectPressed not set')},
        onMovedProjectPressed = function() { console.warn('projectOverview.onMovedProjectPressed not set')},
        onDeleteFolderPressed = function() { console.warn('projectOverview.onDeleteFolderPressed not set')},
        onDirectorySelected = function() { console.warn('projectOverview.onDirectorySelected not set')},
        onCreateDirectoryPressed = function() { console.warn('projectOverview.onCreateDirectoryPressed not set')},
        editModeEnabled = false;

    return {
        /**
         * Called from canny when registering components. The only component which we expect to be registered is
         * "projectOverviewContainer" (the root node of the component).
         * @param node
         * @param vars
         */
        add: function (node, attr) {
            if (componentRootNode === undefined) {
                componentRootNode = node;
            } else {
                console.warn('projectOverview:add multiple views detected - it should be registered only ones in the DOM!');
            }
        },
        /**
         * Called from canny on documentReady event.
         */
        ready: function() {

            var createProjectButtonNode = componentRootNode.querySelector('.js-createProjectButton');
            if (!createProjectButtonNode) {
                console.error('No child node with class "createProjectButton found inside "projectOverviewContainer"');
            } else {
                createProjectButtonNode.addEventListener('click', function(event) {
                    onCreateProjectPressed();
                });
            }

            var createFolderButtonNode = componentRootNode.querySelector('.js-createFolderButton');
            if (!createFolderButtonNode) {
                console.error('No child node with class "createFolderButton found inside "projectOverviewContainer"');
            } else {
                createFolderButtonNode.addEventListener('click', function(event) {
                    onCreateDirectoryPressed();
                });
            }

            var toggleEditModeButtonNode = componentRootNode.querySelector('.js-toggleEditModeButton');
            if (!toggleEditModeButtonNode) {
                console.error('No child node with class "createFolderButton found inside "projectOverviewContainer"');
            } else {
                toggleEditModeButtonNode.addEventListener('click', function(event) {
                    editModeEnabled = !editModeEnabled;
                    componentRootNode.classList.toggle('editMode-enabled', editModeEnabled);
                    toggleEditModeButtonNode.classList.toggle('active', editModeEnabled);
                });
            }

            var selectParentDirectoryButton = componentRootNode.querySelector('.js-selectParentDirectoryButton');
            if (!selectParentDirectoryButton) {
                console.error('No child node with class "selectParentDirectoryButton" found inside "projectOverviewContainer"');
            } else {
                selectParentDirectoryButton.addEventListener('click', function(event) {
                    onParentDirectorySelected();
                });
            }
        },
        /**
         * Inform the ui module about the new current set of directories and projects to list. This will also trigger
         * a new rendering of the projects list with the new content.
         * @param projectNames
         * @param directoryNames
         */
        setProjectsAndDirectories: function (projectNames, directoryNames) {
            var projectsAndDirectories = [];

            if (!projectNames || !directoryNames) {
                return;
            } else if (!renderProjectsAndDirectoriesList) {
                console.error('renderProjectsAndDirectoriesList function has not been set, new list cannot be shown');
                return;
            }

            directoryNames
                .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
                .forEach(function(directoryName) {
                    projectsAndDirectories.push({
                        name : directoryName,
                        dir : true,
                        openProjectListItem : function() {
                            console.log('directory selected:', directoryName);
                            if (onDirectorySelected) {
                                onDirectorySelected(directoryName);
                            }
                        },
                        deleteProjectListItem : function() {
                            var deletionConfirmed = window.confirm('Really delete folder ' + directoryName + '?');
                            if (onDeleteFolderPressed && deletionConfirmed) {
                                onDeleteFolderPressed(directoryName);
                            }
                        }
                    });
                });

            projectNames
                .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
                .forEach(function(projectName) {
                    projectsAndDirectories.push({
                        name : projectName,
                        dir : false,
                        openProjectListItem : function () {
                            console.log('project selected:', projectName);
                            if (onProjectSelected) {
                                onProjectSelected(projectName);
                            }
                        },
                        deleteProjectListItem : function() {
                            var deletionConfirmed = window.confirm('Really delete project ' + projectName + '?');
                            if (onDeleteProjectPressed && deletionConfirmed) {
                                onDeleteProjectPressed(projectName);
                            }
                        },
                        moveProject : () => {
                            onMovedProjectPressed(projectName)
                        }
                    });
                });

            renderProjectsAndDirectoriesList(projectsAndDirectories);
        },
        /**
         * For canny-repeat registered on the projects list, provide the function for rendering the list.
         * @param func a function which will set the list of projects and directories.
         */
        setRenderProjectsAndDirectoriesListFunction : function(func) {
            renderProjectsAndDirectoriesList = func;
        },
        deleteProjectListNode : function(itemName) {
            var node = componentRootNode.querySelector('tr[data-listItem=' + itemName + ']');
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        },
        /**
         * Register a listener callback which will react to "to parent directory" event.
         * @param listener
         */
        onParentDirectorySelected : function(listener) {
            onParentDirectorySelected = listener;
        },
        /**
         * Register a listener callback which will react to clicks on a project. The callback function should expect
         * one parameter which is the project name.
         * @param listener
         */
        onProjectSelected : function(listener) {
            onProjectSelected = listener;
        },
        /**
         * Register a listener callback which will react to clicks on a directory. The callback function should expect
         * one parameter which is the directory name.
         * @param listener
         */
        onDirectorySelected : function(listener) {
            onDirectorySelected = listener;
        },
        onCreateProjectPressed : function(func) {
            onCreateProjectPressed = func;
        },
        onDeleteProjectPressed : function(func) {
            onDeleteProjectPressed = func;
        },
        onDeleteFolderPressed : function(func) {
            onDeleteFolderPressed = func;
        },
        onCreateDirectoryPressed : function(func) {
            onCreateDirectoryPressed = func;
        },
        onMoveDirectoryPressed : function(func) {
            onMovedProjectPressed = func;
        }
    };
})();

module.exports = projectOverview;
