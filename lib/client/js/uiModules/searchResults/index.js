const whisker = require('canny/mod/whisker')
const flags = require('../flag');
const template = require('./index.html')
const ProjectItem = require('./ProjectItem.html')
const KeyItem = require('./KeyItem.html')
const NoMatches = require('./NoMatches.html')

module.exports = function ({onClose}) {
    // saves the active node
    let ui;

    function render(results) {
        if (ui) ui.remove()
        const d = document.createElement('div')
        d.innerHTML = template
        whisker.add(d.children[0], {
            title : results.search_term,
            close : n => n.addEventListener('click', onClose),
        })

        const list = d.querySelector('.results-list');

        if (results.data.length > 0) {
            results.data.forEach(item => {
                let htmlProject = document.createElement('div');
                htmlProject.innerHTML = ProjectItem;
                whisker.add(htmlProject, {
                    project_id: item.project_id
                });

                const keyList = htmlProject.querySelector('.key-list');

                item.results.forEach(result => {
                    let htmlKey = document.createElement('div');
                    htmlKey.innerHTML = KeyItem;
                    whisker.add(htmlKey, {
                        key: result.key,
                        url: result.url,
                        lang: flags.getLang(result.lang),
                        text: result.text
                    });
                    keyList.appendChild(htmlKey.children[0]);
                });
                list.appendChild(htmlProject.children[0]);
            });
        } else {
            let htmlProject = document.createElement('div');
            htmlProject.innerHTML = NoMatches;
            list.appendChild(htmlProject.children[0]);
        }

        document.body.appendChild(ui = d.children[0])
    }

    return {
        /**
         * Show the module
         * @param {string} err - error code to print on the view
         */
        render: (data) => render(data),
        /**
         * Remove the module from ui
         */
        destroy : () => {
            ui.remove()
            ui = undefined
        }
    }
}