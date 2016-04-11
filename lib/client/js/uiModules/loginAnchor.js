var loginAnchor = (function () {
		"use strict";

		return {
			add: function (node) {

				var location = document.location.href,
					anchor = '';

				if (location.indexOf('#') > -1) {
					anchor = '#' + location.split('#').pop();
				}

				node.setAttribute('type', 'hidden');
				node.setAttribute('name', 'from');
				node.setAttribute('value', anchor);
			}
		};

	}());

module.exports = loginAnchor;