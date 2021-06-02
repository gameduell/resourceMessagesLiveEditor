const whisker = require('canny/mod/whisker')
const flags = require('../flag');
const template = require('./index.html')
const ProjectItem = require('./ProjectItem.html')
const KeyItem = require('./KeyItem.html')
const NoMatches = require('./NoMatches.html')
const LangButton = require('./LangButton.html')

module.exports = function ({onClose}) {
    // saves the active node
    let ui;

    function render(results) {
        if (ui) ui.remove()
        const d = document.createElement('div')
        d.innerHTML = template

        const langSwitch = d.querySelector('.language-switch');
        const list = d.querySelector('.results-list');
        let resultsCounted = 0;
        let languages = [];

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
                    const lang = flags.getLang(result.lang);
                    whisker.add(htmlKey, {
                        key: result.key,
                        url: result.url,
                        lang: lang,
                        text: result.text
                    });
                    keyList.appendChild(htmlKey.children[0]);
                    resultsCounted++;
                    if (languages.indexOf(lang) === -1) {
                        languages.push(lang);
                        let langButton = document.createElement('div');
                        langButton.innerHTML = LangButton;
                        whisker.add(langButton, {
                            lang: lang,
                        });
                        langSwitch.appendChild(langButton.children[0]);
                    }
                });
                list.appendChild(htmlProject.children[0]);
            });
        } else {
            let htmlProject = document.createElement('div');
            htmlProject.innerHTML = NoMatches;
            list.appendChild(htmlProject.children[0]);
        }


        whisker.add(d.children[0], {
            title : results.search_term,
            resultsCounted : resultsCounted,
            close : n => n.addEventListener('click', onClose),
        })

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