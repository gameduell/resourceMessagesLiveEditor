const canny = require("canny");

var searchBar = canny.searchBar,
    loadingModal = canny.loadingModal,
    trade = require("../trade"),
    SearchResults = require("../uiModules/searchResults"),
    searchResultsUi = SearchResults({
        onClose: () => searchResultsUi.destroy(),
    })

canny.add("searchResults", SearchResults);

searchBar.onSearch(function () {
    loadingModal.show();
    const searchValue = searchBar.inputNode.value;
    if (searchValue.length > 2) {
        trade.searchTerm(searchValue, function (response) {
            loadingModal.hide();
            searchResultsUi.render(response);
        });
    }
});

module.exports = {};
