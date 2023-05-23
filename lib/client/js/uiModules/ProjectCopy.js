var projectCopy = (function () {
    'use strict'
    var onConfirmListener = function () {},
        onCloseListener = function () {},
        renderProjectList,
        renderKeyWarnings,
        keyWarnings,
        root,
        projectList,
        selectedProjectId,
        selectedProject,
        warnings,
        brain = {
            root: {
                init: function (node) {
                    root = node
                    root.addEventListener('click', onClickRoot)
                },
            },
            selectedProject: {
                init: function (node) {
                    selectedProject = node
                },
            },
            warnings: {
                init: function (node) {
                    warnings = node
                },
            },
            btnCloseWarnings: {
                init: function (node) {
                    node.addEventListener('click', function () {
                        warnings.classList.remove('show')
                    })
                },
            },
            btnConfirm: {
                init: function (node) {
                    node.addEventListener('click', onClickConfirmBtn)
                },
            },
            btnClose: {
                init: function (node) {
                    node.addEventListener('click', onClickCloseBtn)
                },
            },
        }

    function onClickConfirmBtn(event) {
        event.preventDefault()
        if (!selectedProjectId) {
            return
        }

        var { id, url, name, file } = projectList.find(function (item) {
            return item.id === selectedProjectId
        })
        onConfirmListener({ id, url, name, file })
    }

    function onClickCloseBtn(event) {
        event.preventDefault()
        onCloseListener()
    }

    function onClickRoot(event) {
        event.preventDefault()
        if (event.target === event.currentTarget) {
            onCloseListener()
        }
    }

    function updateSelectionLabel(projectId) {
        selectedProject.innerHTML = !projectId ? '-' : projectId
    }

    function reset() {
        selectedProjectId = null
        keyWarnings = []
        renderKeyWarnings(keyWarnings)
        renderProjectList(projectList)
        updateSelectionLabel()
    }

    return {
        add: function (node, attr) {
            if (brain.hasOwnProperty(attr)) {
                brain[attr].init(node)
            }
        },
        setSubmitListener: function (fc) {
            onConfirmListener = fc
        },
        setCloseListener: function (fc) {
            onCloseListener = fc
        },
        reset: reset,
        /**
         * Inform the ui module about the new current set of directories and projects to list. This will also trigger
         * a new rendering of the projects list with the new content.
         * @param projectNames
         * @param directoryNames
         */
        setProjects: function (projects) {
            var keys = Object.keys(projects),
                values = Object.values(projects)

            if (!renderProjectList) {
                console.error(
                    'renderProjectList function has not been set, new list cannot be shown'
                )
                return
            }

            projectList = []

            for (var index = 0; index < keys.length; index++) {
                projectList.push(
                    Object.assign({ id: keys[index] }, values[index])
                )
            }

            projectList = projectList
                .sort((a, b) => {
                    if (a.url.toLowerCase() < b.url.toLowerCase()) {
                        return -1
                    } else if (a.url.toLowerCase() === b.url.toLowerCase()) {
                        return a.name.toLowerCase() < b.name.toLowerCase()
                            ? -1
                            : 1
                    } else {
                        return 1
                    }
                })
                .map(function (item) {
                    return Object.assign(item, {
                        projectId: function () {
                            return item.id
                        },
                        className: function () {
                            return item.id === selectedProjectId
                                ? 'selected'
                                : ''
                        },
                        selectProjectForImport: function (event) {
                            event.preventDefault()
                            if (selectedProjectId === item.id) {
                                selectedProjectId = null
                            } else {
                                selectedProjectId = item.id
                            }
                            updateSelectionLabel(selectedProjectId)
                            renderProjectList(projectList)
                        },
                    })
                })

            renderProjectList(projectList)
        },
        /**
         * For canny-repeat registered on the projects list, provide the function for rendering the list.
         * @param func a function which will set the list of projects and directories.
         */
        setRenderProjectList: function (func) {
            renderProjectList = func
        },
        setRenderKeyWarnings: function (func) {
            renderKeyWarnings = func
        },
        showKeyWarnings: function (data) {
            renderKeyWarnings(data)
            warnings.classList.add('show')
        },
    }
})()

module.exports = projectCopy
