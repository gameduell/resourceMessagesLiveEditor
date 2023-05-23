var canny = require('canny'),
    JsonImport = canny.JsonImport,
    displayManager = canny.displayManager,
    uiEvents = require('../uiEventManager.js'),
    projectInfo;

function sendFile(file) {
    var uri = '/importJSON?projectId=' + projectInfo.id + '&project=' + projectInfo.name,
        xhr = new XMLHttpRequest(),
        fd = new FormData();

    xhr.open("POST", uri, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var data = JSON.parse(xhr.responseText);
            if (xhr.status == 200) {
                uiEvents.callUievent('jsonImported', projectInfo.id)
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
    showJSONImport : function (id) {
        displayManager.show('JSONImportView');
    }
});

JsonImport.onUpload(function (file) {
    sendFile(file);
});

module.exports = {
    onNewProjectCreated : applyProjectData,
    onLoadProject : applyProjectData
};