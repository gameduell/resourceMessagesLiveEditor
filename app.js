var translatron = require('./translatron')
// start the server with defaults
const translatronUi = process.argv[2]
const resourcesPath = '/opt/translation/resources'

if (translatronUi) {
    translatron({
        translatronUi: true
    });
} else{
    translatron({
        fileStorage : {
            projectFiles : resourcesPath + '/translations',
            images : resourcesPath + '/images'
        },
        search: {
            socket: '/tmp/trans-search.sock'
        }
    })
}
