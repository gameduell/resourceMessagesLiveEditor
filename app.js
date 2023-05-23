var translatron = require('./translatron')
// start the server with defaults
const translatronUi = process.argv[2]
const pathToTranslations = '/opt/translation/resources'

if (translatronUi) {
    translatron({
        translatronUi: true
    });
} else{
    translatron({
        fileStorage : {
            projectFiles : pathToTranslations + '/translations',  // file storage for project fields
            images : pathToTranslations + '/images'  // file storage for uploaded images
        },
        search: {
            socket: '/tmp/trans-search.sock'
        }
    })
}
