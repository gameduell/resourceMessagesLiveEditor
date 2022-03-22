const whisker = require("canny/mod/whisker");
const flags = require("../flag");
const template = require("./index.html");
const Headline = require("./Headline.html");
const Filters = require("./Filters.html");
const ProjectItem = require("./ProjectItem.html");
const KeyItem = require("./KeyItem.html");
const NoMatches = require("./NoMatches.html");
const LangButton = require("./LangButton.html");
const PageButton = require("./PageButton.html");

module.exports = function ({ onClose }) {
  let results;
  let selectedLanguages = [];

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
    currentPage = 0;
    results && renderPage(results);
  });

  const pagination = content.querySelector(".pagination");
  const ENTRIES_PER_PAGE = 10;
  let currentPage = 0;

  function filterLanguages(projects, languages) {
    var cloneData = JSON.parse(JSON.stringify(projects))
    return cloneData
      .map((item) => {
        item.results = item.results.filter(
          (result) => languages.indexOf(result.lang) !== -1
        );
        return item;
      })
      .filter((item) => item.results.length > 0);
  }

  function filterCaseSensitive(projects, searchTerm, isSensitive) {
    var cloneData = JSON.parse(JSON.stringify(projects))
    return cloneData
      .map((item) => {
        item.results = item.results.filter(
          (result) =>
            !isSensitive ||
            (isSensitive && result.text.indexOf(searchTerm) !== -1)
        );
        return item;
      })
      .filter((item) => item.results.length > 0);
  }

  function getMetaData(entries) {
    let resultsCounted = 0;
    let languages = [];
    entries.forEach((item) => {
      item.results.forEach((result) => {
        if (languages.indexOf(result.lang) === -1) {
          languages.push(result.lang);
        }
        resultsCounted++;
      });
    });
    return {
      resultsCounted,
      languages,
    };
  }

  function renderHeader(data, htmlElement) {
    whisker.add(htmlElement, {
      title: data.searchTerm,
      resultsCounted: data.resultsCounted,
      close: (n) => n.addEventListener("click", onClose),
    });
  }

  function renderFlags(languages, htmlElement) {
    // Render flags on top of results-list
    languages
      .sort((a, b) => (a < b ? -1 : 1))
      .forEach((lang) => {
        let langButton = document.createElement("div");
        langButton.innerHTML = LangButton;
        whisker.add(langButton, {
          lang: flags.getLang(lang),
          country: lang,
        });

        if (selectedLanguages.indexOf(lang) !== -1) {
          langButton.children[0].classList.add("active");
        }
        langButton.children[0].addEventListener("click", function () {
          var position = selectedLanguages.indexOf(lang);
          if (position === -1) {
            selectedLanguages.push(lang);
          } else {
            selectedLanguages.splice(position, position + 1);
          }
          currentPage = 0;
          results && renderPage(results);
        });
        htmlElement.appendChild(langButton.children[0]);
      });
  }

  function renderResults(items, rangeStart, rangeEnd, htmlList) {
    items
      .filter((item, index) => index >= rangeStart && index < rangeEnd)
      .forEach((item) => {
        let htmlProject = document.createElement("div");
        htmlProject.innerHTML = ProjectItem;
        whisker.add(htmlProject, {
          project_id: item.project_id,
        });

        const keyList = htmlProject.querySelector(".key-list");

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
        });

        if (keyList.childElementCount > 0) {
          htmlList.appendChild(htmlProject.children[0]);
        }
      });
  }

  function renderPagination(numPages, htmlElement) {
    for (let pageNumber = 0; pageNumber <= numPages; pageNumber++) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = PageButton;

      const button = wrapper.children[0];

      whisker.add(button, {
        pageNumber: pageNumber + 1,
      });

      button.addEventListener("click", function () {
        currentPage = pageNumber;
        results && renderPage(results);
      });

      if (currentPage === pageNumber) {
        button.classList.add("active");
      }

      htmlElement.appendChild(button);
    }
  }

  function renderPage(res) {
    let projectEntries = res.data;
    const searchTerm = res.search_term;

    headline.innerHTML = Headline;
    langSwitch.innerHTML = "";
    list.innerHTML = "";
    pagination.innerHTML = "";

    if (projectEntries.length > 0) {
      const rangeStart = currentPage * ENTRIES_PER_PAGE;
      const rangeEnd = (currentPage + 1) * ENTRIES_PER_PAGE;

      if (selectedLanguages.length > 0) {
        projectEntries = filterLanguages(projectEntries, selectedLanguages);
      }

      projectEntries = filterCaseSensitive(
        projectEntries,
        searchTerm,
        checkboxCase.checked
      );

      const metadata = getMetaData(results.data);

      renderHeader(
        { searchTerm, resultsCounted: metadata.resultsCounted },
        content
      );
      renderFlags(metadata.languages, langSwitch);
      renderResults(projectEntries, rangeStart, rangeEnd, list);
      const numPages = Math.floor(projectEntries.length / ENTRIES_PER_PAGE);
      if (numPages > 0) {
        renderPagination(numPages, pagination);
      }
    } else {
      renderHeader({ searchTerm, resultsCounted: 0 }, content);
      const htmlProject = document.createElement("div");
      htmlProject.innerHTML = NoMatches;
      list.appendChild(htmlProject.children[0]);
    }

    document.body.appendChild(content);
  }

  return {
    /**
     * Show the module
     * @param {string} err - error code to print on the view
     */
    render: function (data) {
      results = data;
      renderPage(results);
    },
    /**
     * Remove the module from ui
     */
    destroy: function () {
      pagination.innerHTML = "";
      document.body.removeChild(content);
      selectedLanguages.length = 0;
      currentPage = 0;
    },
  };
};
