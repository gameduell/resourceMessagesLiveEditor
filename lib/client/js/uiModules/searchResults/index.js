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

  /**
   * Filter search results for given languages
   *
   * @param   {Object[]}  projects   List of search result data separated into Translatron projects
   * @param   {String[]}  languages  List of selected languages, i.e. reflects the checked language-flags in the UI
   *
   * @return  {Object}               Filtered search-result data
   */
  function filterLanguages(projects, languages) {
    const cloneData = JSON.parse(JSON.stringify(projects));
    return cloneData
      .map((item) => {
        item.results = item.results.filter(
          (result) => languages.indexOf(result.lang) !== -1
        );
        return item;
      })
      .filter((item) => item.results.length > 0);
  }

  /**
   * Filter search-results for case-sensitive
   *
   * @param   {Object[]}  projects   List of search result data separated into Translatron projects
   * @param   {String}    searchTerm   Search-term the user was entering into the search-input within the page's header
   * @param   {Boolean}   isSensitive  Flag to determine whether to filter the data for exactly the search-term (false by default)
   *
   * @return  {Object}                 Filtered search-result data
   */
  function filterCaseSensitive(projects, searchTerm, isSensitive) {
    const cloneData = JSON.parse(JSON.stringify(projects));
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

  /**
   * Create Metadata out of given search-result data,
   * i.e. the languages the search-term appears in
   * and the overall amount of translation-keys the term was found in
   *
   * @param   {Object[]}  projects     Map with search result data categorized by Translatron projects the term was found in
   *
   * @return  {Object}                 Object containing a list of language locales and a count of how many keys contain the search-term
   */
  function getMetaData(projects) {
    let resultsCounted = 0;
    let languages = [];
    projects.forEach((item) => {
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

  /**
   * Render the modal header UI containing the search-term and the amount of translation keys the search-term was found in
   * Makes use of canny's whisker module, see https://github.com/eightyfour/canny/tree/master/mod for further info on this
   *
   * @param   {Object}       metaData     Data passed to whisker which will interpolate it into the DOM placeholders
   * @param   {HTMLElement}  htmlElement  Container to render the given data into
   *
   * @return  {void}
   */
  function renderHeader(metaData, htmlElement) {
    whisker.add(htmlElement, {
      title: metaData.searchTerm,
      resultsCounted: metaData.resultsCounted,
      close: (n) => n.addEventListener("click", onClose),
    });
  }

  /**
   * Render UI buttons representing languages the search-term was found in
   * whereas each button works rather like a checkbox, e.g. multiple buttons can be active,
   * filtering the search-restul data for just the active buttons/checkboxes
   *
   * @param   {String[]}     languages    List of locales
   * @param   {HTMLElement}  htmlElement  Container to add the buttons representing available languages to
   *
   * @return  {void}
   */
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

        // Event-handler to filter results for selected languages
        langButton.children[0].addEventListener("click", function () {
          const position = selectedLanguages.indexOf(lang);
          if (position === -1) {
            selectedLanguages.push(lang);
          } else {
            selectedLanguages.splice(position, 1);
          }
          currentPage = 0;
          results && renderPage(results);
        });
        htmlElement.appendChild(langButton.children[0]);
      });
  }

  /**
   * Render paginated table/list UI of search-results
   *
   * @param   {Object[]}     projects    List of search-result data categorized by translation project
   * @param   {number}       rangeStart  Index position to start reflecting the first project to be rendered on the page
   * @param   {number}       rangeEnd    Index position to end reflecting the last project to be rendered on the page
   * @param   {HTMLElement}  htmlList    Parent container to insert the results into
   *
   * @return  {void}
   */
  function renderResults(projects, rangeStart, rangeEnd, htmlList) {
    projects
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
          });
          const txtNode = htmlKey.children[0].querySelector(".text");
          const regex = new RegExp(results.search_term, "ig");
          txtNode.innerHTML = result.text.replaceAll(
            regex,
            '<span class="highlight">$&</span>'
          );
          keyList.appendChild(htmlKey.children[0]);
        });

        if (keyList.childElementCount > 0) {
          htmlList.appendChild(htmlProject.children[0]);
        }
      });
  }

  /**
   * Render the pagination UI
   *
   * @param   {number}       numPages     Total number of pages containing search-result data
   * @param   {HTMLElement}  htmlElement  Container the pagination buttons are inserted into
   *
   * @return  {void}
   */
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

  /**
   * Render the whole page/view
   *
   * @param   {Object}  res  Search-result data returned by trans-search-rs
   *
   * @return  {void}
   */
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
