const whisker = require("canny/mod/whisker");
const flags = require("../flag");
const template = require("./index.html");
const Headline = require("./Headline.html");
const Filters = require("./Filters.html");
const ProjectItem = require("./ProjectItem.html");
const KeyItem = require("./KeyItem.html");
const NoMatches = require("./NoMatches.html");
const LangButton = require("./LangButton.html");

module.exports = function ({ onClose }) {
  let results;

  const node = document.createElement("div");
  node.innerHTML = template;

  const content = node.children[0];
  const headline = content.querySelector(".headline");
  const langSwitch = content.querySelector(".language-switch");
  const list = content.querySelector(".results-list");
  const filters = content.querySelector(".filters");
  filters.innerHTML = Filters;

  const checkboxCase = filters.querySelector("#filter-casesensitive");
  checkboxCase.addEventListener("change", function (event) {
    results && render(results);
  });

  function render(data) {
    results = data;

    headline.innerHTML = Headline;
    langSwitch.innerHTML = "";
    list.innerHTML = "";

    const isCaseSensitive = checkboxCase.checked;
    let resultsCounted = 0;
    let languages = [];

    let clonedData = JSON.parse(JSON.stringify(results));
    const searchTerm = clonedData.search_term;

    if (clonedData.data.length > 0) {
      clonedData.data.forEach((item) => {
        let htmlProject = document.createElement("div");
        htmlProject.innerHTML = ProjectItem;
        whisker.add(htmlProject, {
          project_id: item.project_id,
        });

        const keyList = htmlProject.querySelector(".key-list");

        item.results = item.results.filter(
          (result) =>
            !isCaseSensitive ||
            (isCaseSensitive && result.text.indexOf(searchTerm) !== -1)
        );

        item.results.forEach((result) => {
          let htmlKey = document.createElement("div");
          htmlKey.innerHTML = KeyItem;
          const lang = flags.getLang(result.lang);
          whisker.add(htmlKey, {
            key: result.key,
            url: result.url,
            lang: lang,
            text: result.text,
          });
          keyList.appendChild(htmlKey.children[0]);
          resultsCounted++;

          if (languages.indexOf(lang) === -1) {
            languages.push(lang);
            let langButton = document.createElement("div");
            langButton.innerHTML = LangButton;
            whisker.add(langButton, {
              lang: lang,
            });
            langSwitch.appendChild(langButton.children[0]);
          }
        });

        if (keyList.childElementCount > 0) {
          list.appendChild(htmlProject.children[0]);
        }
      });
    } else {
      let htmlProject = document.createElement("div");
      htmlProject.innerHTML = NoMatches;
      list.appendChild(htmlProject.children[0]);
    }

    whisker.add(content, {
      title: searchTerm,
      resultsCounted: resultsCounted,
      close: (n) => n.addEventListener("click", onClose),
    });

    // node.classList.addClass('show');
    document.body.appendChild(content);
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
    destroy: () => {
      // node.classList.removeClass('show');
      document.body.removeChild(content);
    },
  };
};
