var translatron = require('./translatron')
// start the server with defaults
const translatronUi = process.argv[2]

if (translatronUi) {
    translatron({
        translatronUi: true
    });
} else{
    translatron({
        search: {
            socket: '/tmp/trans-search.sock'
        }
    })
}
