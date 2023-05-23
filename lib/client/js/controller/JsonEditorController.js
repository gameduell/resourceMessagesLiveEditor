const toast = require('../Toast.js')
const trade = require('../trade.js')

var canny = require('canny'),
    JsonEditor = canny.JsonEditor,
    displayManager = canny.displayManager,
    uiEvents = require('../uiEventManager.js'),
    projectInfo

function applyProjectData(data, project) {
    projectInfo = project
}

//----------------------------------------------------
// UI events listeners
//----------------------------------------------------
uiEvents.addUiEventListener({
    showJsonEditor: function (id) {
        displayManager.show('JsonEditorView')
    },
})

//----------------------------------------------------
// Component listeners
//----------------------------------------------------

/**
 * Fetches content of current project in json format
 * and passes it back into the editor component via callback
 *
 * @param   {[type]}  function  Listener function which is triggered by button click
 * @param   {[type]}  callback  Callback function executing inside editor component after data has been fetched successfully
 */
JsonEditor.setLoadListener(function loadContent(callback) {
    var uri = '/' + projectInfo.id + '.json?category=true',
        xhr = new XMLHttpRequest()

    xhr.open('GET', uri, true)
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            var data = JSON.parse(xhr.responseText)
            if (xhr.status == 200) {
                callback && callback(data)
            } else if (xhr.status === 406) {
                toast.showMessage(
                    'Failed to fetch project data. There is an error:<br />' +
                        data.msg
                )
            }
        }
    }
    xhr.send()
})

/**
 * [setSubmitListener description]
 *
 * @param   {[type]}  function  [function description]
 * @param   {[type]}  data      [data description]
 */
JsonEditor.setSubmitListener(function (data, options) {
    trade.importJSON(
        projectInfo,
        data,
        options,
        function (err, projectId, projectData) {
            if (err) {
                toast.showMessage(err.message)
                if (projectData) {
                    JsonEditor.showKeyWarnings(projectData)
                }
            }
        }
    )
})

JsonEditor.setCloseListener(function closeModal() {
    displayManager.hide('JsonEditorView')
    JsonEditor.reset()
})

module.exports = {
    onNewProjectCreated: applyProjectData,
    onLoadProject: applyProjectData,
    jsonImported: function (projectId, projectData) {
        uiEvents.callUievent('jsonImported', projectInfo.id)
        toast.showMessage('Imported JSON successfully')
    },
}
