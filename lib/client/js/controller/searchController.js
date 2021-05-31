const canny = require("canny");

var searchBar = require("canny").searchBar,
    trade = require("../trade"),
    SearchResults = require("../uiModules/searchResults"),
    searchResultsUi = SearchResults({
        onClose: () => searchResultsUi.destroy(),
    });

canny.add("searchResults", SearchResults);

searchBar.onSearch(function () {
    const searchValue = searchBar.inputNode.value;
    if (searchValue.length > 0) {
        trade.searchTerm(searchValue, function (response) {
            searchResultsUi.render(response);
        });
    }
});

module.exports = {};
