const toast = require('../Toast.js')

var canny = require('canny'),
    ProjectCopy = canny.ProjectCopy,
    displayManager = canny.displayManager,
    trade = require('../trade.js'),
    uiEvents = require('../uiEventManager.js'),
    projectInfo

function applyProjectData(data, project) {
    projectInfo = project
}

ProjectCopy.setSubmitListener(function (project2Copy) {
    if (!project2Copy) {
        console.error('Error at cloning project.')
        return
    }

    trade.copyProject(
        projectInfo,
        project2Copy,
        function (err, projectId, projectData) {
            if (err) {
                toast.showMessage('Blocked import due to key duplicates.')
                ProjectCopy.showKeyWarnings(projectData)
                console.log('Duplicated keys: ', projectData)
            }
        }
    )
})

ProjectCopy.setCloseListener(function closeModal() {
    ProjectCopy.reset()
    displayManager.hide('ProjectCopyView')
})

uiEvents.addUiEventListener({
    showCopyModal: function (id) {
        trade.getTableOfContents(function (err) {
            toast.showMessage(
                'Could not retrieve list of projects: ' + err.message
            )
        })
        displayManager.show('ProjectCopyView')
    },
})

module.exports = {
    onNewProjectCreated: applyProjectData,
    onLoadProject: applyProjectData,
    /**
     * Callback from the server which handles a fresh directory/projects list
     *
     * @param {{currentDirectory:string, dirs:[{name, id}], parentDirectories:[{name, id}], parentDirectory:string, projects:[{name, id}] }} data - an object with 2 properties "projects" and "directories", each listing project/directory names.
     */
    getTableOfContents: function (data) {
        if (!data) {
            console.error('Server call failed')
        } else {
            ProjectCopy.setProjects(data)
        }
    },
    copyProject: function (message) {
        uiEvents.callUievent('jsonImported', projectInfo.id)
        toast.showMessage(message)
    },
}
