(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var canny = require('canny');
canny.add('loginAnchor', require('./uiModules/loginAnchor.js'));

},{"./uiModules/loginAnchor.js":2,"canny":3}],2:[function(require,module,exports){
'use strict';

var loginAnchor = function () {
	"use strict";

	return {
		add: function add(node) {

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
}();

module.exports = loginAnchor;

},{}],3:[function(require,module,exports){
/*global */
/*jslint browser: true*/
/**
 *
 * E.g.:
 *  canny-mod="moduleObj" canny-var="{'propertyKey':'value'}"
 *  canny-mod="moduleString" canny-var="button"
 *
 * Instead of canny-var you can use the module name to avoid conflicts like:
 * E.g.: canny-mod="mod1 mod2" canny-mod1={'foo':'123456', 'bar':'654321'} canny-mod2="mod2Property"
 *
 * ---------------------------------------------------------------------------- eightyfour
 */
(function (global) {
    "use strict";
    var canny = (function () {
        var readyQueue = [],
            readyQueueInit = false,
            moduleQueue = []; // save modules to call the ready method once

        /**
         * Find the single quotes and replace them with double quotes except string which
         * are part of the property string.
         *
         * @param string
         * @returns {string}
         */
        function escapeStringForJSON(string) {
            var s = string
                .replace(/\{\s*\'/g,'{"').replace(/\'\s*\}/g,'"}')
                .replace(/:\s*\'/g,':"').replace(/\'\s*:/g,'":')
                .replace(/,\s*\'/g,',"').replace(/\'\s*,/g,'",')
                .replace(/\[\s*\'/g,'["').replace(/\'\s*\]/g,'"]');
            return s;
        }

        function escapeStringForJSONArray(string) {
            var s = string
                .replace(/,\s*\'/g,',"').replace(/\'\s*,/g,'",')
                .replace(/\[\s*\'/g,'["').replace(/\'\s*\]/g,'"]');
            return s;
        }

        function callMethodQueue(queue) {
            (function reduce() {
                var fc = queue.pop();
                if (fc) {
                    fc();
                    reduce();
                } else {
                    queue = [];
                }
            }());
        }

        function parseNode(node, name, cb) {
            var that = this, gdModuleChildren = [].slice.call(node.querySelectorAll('[' + name + '-mod]')), prepareReadyQueue = {};

            gdModuleChildren.forEach(function (node) {
                var attribute = node.getAttribute(name + '-mod'), attr, viewPart, attributes, cannyVar;

                attributes = attribute.split(' ');

                attributes.forEach(function (moduleName) {
                    if (that[moduleName]) {
                        if (node.getAttribute(name + '-mod')) {
                            if (node.getAttribute(name + '-' + moduleName)) {
                                cannyVar = node.getAttribute(name + '-' + moduleName);
                            } else {
                                cannyVar = node.getAttribute(name + '-var');
                            }
                            if (cannyVar) {
                                // simple JSON test
                                if (/\{\s*\'|\".*:.*\}/.test(cannyVar)) {
                                    attr = escapeStringForJSON(cannyVar);
                                    // could be a JSON
                                    try {
                                        viewPart = JSON.parse(attr);
                                    } catch (ex) {
                                        console.error("canny can't parse passed JSON for module: " + moduleName, node);
                                    }
                                } else if (/\[\s*\'|\".*\'|\"\]/.test(cannyVar)) {
                                    attr = escapeStringForJSONArray(cannyVar);
                                    try {
                                        viewPart = JSON.parse(attr);
                                    } catch (ex) {
                                        console.error("canny can't parse passed JSON for module: " + moduleName, node);
                                    }
                                } else {
                                    viewPart = cannyVar;
                                }
                            }
                        }
                        // has module a ready function than save it for calling
                        if (that[moduleName].hasOwnProperty('ready')) {
                            // TODO or call it immediately?
                            prepareReadyQueue[moduleName] = that[moduleName].ready;
                        }
                        if (that.hasOwnProperty(moduleName)) {
                            that[moduleName].add(node, viewPart);
                        }
                    } else {
                        console.warn('canny parse: module with name ´' + moduleName + '´ is not registered');
                    }
                });
            });
            // add ready callback to moduleQueue
            Object.keys(prepareReadyQueue).forEach(function (name) {
                moduleQueue.push(prepareReadyQueue[name]);
            });
            cb && cb();
        }

        document.addEventListener('DOMContentLoaded', function cannyDomLoad() {
            document.removeEventListener('DOMContentLoaded', cannyDomLoad);

            parseNode.apply(canny, [document, 'canny']);

            callMethodQueue(moduleQueue);
            // call registered ready functions
            readyQueueInit = true;
            callMethodQueue(readyQueue);
        }, false);

        return {
            add : function (name, module) {
                var moduleApi = module;
                if (!this.hasOwnProperty(name)) {
                    if (typeof module === 'function') {
                        moduleApi = module(this); // initialize the module with the actual canny instance
                    }
                    this[name] = moduleApi;
                } else {
                    console.error('canny: Try to register module with name ' + name + ' twice');
                }
            },
            ready : function (fc) {
                if (!readyQueueInit) {
                    readyQueue.push(fc);
                } else {
                    fc();
                }
            },
            cannyParse : function (node, name, cb) {
                // TODO needs a callback
                if (typeof name === 'function') {
                    cb = name;
                    name = "canny";
                }
                parseNode.apply(this || canny, [node, name || 'canny', function () {
                    callMethodQueue(moduleQueue);
                    cb && cb();
                }]);
            }
        };
    }());
    // export as module or bind to global
    if (typeof module !== 'undefined' && module.hasOwnProperty('exports')) { module.exports = canny; } else {global.canny = canny; }
}(this));
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY2xpZW50L2pzL2xvZ2luLmpzIiwibGliL2NsaWVudC9qcy91aU1vZHVsZXMvbG9naW5BbmNob3IuanMiLCJub2RlX21vZHVsZXMvY2FubnkvY2FubnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLElBQUksUUFBUSxRQUFRLE9BQVIsQ0FBWjtBQUNBLE1BQU0sR0FBTixDQUFVLGFBQVYsRUFBeUIsUUFBUSw0QkFBUixDQUF6Qjs7Ozs7QUNEQSxJQUFJLGNBQWUsWUFBWTtBQUM3Qjs7QUFFQSxRQUFPO0FBQ04sT0FBSyxhQUFVLElBQVYsRUFBZ0I7O0FBRXBCLE9BQUksV0FBVyxTQUFTLFFBQVQsQ0FBa0IsSUFBakM7QUFBQSxPQUNDLFNBQVMsRUFEVjs7QUFHQSxPQUFJLFNBQVMsT0FBVCxDQUFpQixHQUFqQixJQUF3QixDQUFDLENBQTdCLEVBQWdDO0FBQy9CLGFBQVMsTUFBTSxTQUFTLEtBQVQsQ0FBZSxHQUFmLEVBQW9CLEdBQXBCLEVBQWY7QUFDQTs7QUFFRCxRQUFLLFlBQUwsQ0FBa0IsTUFBbEIsRUFBMEIsUUFBMUI7QUFDQSxRQUFLLFlBQUwsQ0FBa0IsTUFBbEIsRUFBMEIsTUFBMUI7QUFDQSxRQUFLLFlBQUwsQ0FBa0IsT0FBbEIsRUFBMkIsTUFBM0I7QUFDQTtBQWJLLEVBQVA7QUFnQkEsQ0FuQmlCLEVBQW5COztBQXFCQSxPQUFPLE9BQVAsR0FBaUIsV0FBakI7OztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgY2FubnkgPSByZXF1aXJlKCdjYW5ueScpO1xuY2FubnkuYWRkKCdsb2dpbkFuY2hvcicsIHJlcXVpcmUoJy4vdWlNb2R1bGVzL2xvZ2luQW5jaG9yLmpzJykpOyIsInZhciBsb2dpbkFuY2hvciA9IChmdW5jdGlvbiAoKSB7XG5cdFx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0YWRkOiBmdW5jdGlvbiAobm9kZSkge1xuXG5cdFx0XHRcdHZhciBsb2NhdGlvbiA9IGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsXG5cdFx0XHRcdFx0YW5jaG9yID0gJyc7XG5cblx0XHRcdFx0aWYgKGxvY2F0aW9uLmluZGV4T2YoJyMnKSA+IC0xKSB7XG5cdFx0XHRcdFx0YW5jaG9yID0gJyMnICsgbG9jYXRpb24uc3BsaXQoJyMnKS5wb3AoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2hpZGRlbicpO1xuXHRcdFx0XHRub2RlLnNldEF0dHJpYnV0ZSgnbmFtZScsICdmcm9tJyk7XG5cdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKCd2YWx1ZScsIGFuY2hvcik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHR9KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxvZ2luQW5jaG9yOyIsIi8qZ2xvYmFsICovXG4vKmpzbGludCBicm93c2VyOiB0cnVlKi9cbi8qKlxuICpcbiAqIEUuZy46XG4gKiAgY2FubnktbW9kPVwibW9kdWxlT2JqXCIgY2FubnktdmFyPVwieydwcm9wZXJ0eUtleSc6J3ZhbHVlJ31cIlxuICogIGNhbm55LW1vZD1cIm1vZHVsZVN0cmluZ1wiIGNhbm55LXZhcj1cImJ1dHRvblwiXG4gKlxuICogSW5zdGVhZCBvZiBjYW5ueS12YXIgeW91IGNhbiB1c2UgdGhlIG1vZHVsZSBuYW1lIHRvIGF2b2lkIGNvbmZsaWN0cyBsaWtlOlxuICogRS5nLjogY2FubnktbW9kPVwibW9kMSBtb2QyXCIgY2FubnktbW9kMT17J2Zvbyc6JzEyMzQ1NicsICdiYXInOic2NTQzMjEnfSBjYW5ueS1tb2QyPVwibW9kMlByb3BlcnR5XCJcbiAqXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGVpZ2h0eWZvdXJcbiAqL1xuKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgY2FubnkgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVhZHlRdWV1ZSA9IFtdLFxuICAgICAgICAgICAgcmVhZHlRdWV1ZUluaXQgPSBmYWxzZSxcbiAgICAgICAgICAgIG1vZHVsZVF1ZXVlID0gW107IC8vIHNhdmUgbW9kdWxlcyB0byBjYWxsIHRoZSByZWFkeSBtZXRob2Qgb25jZVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaW5kIHRoZSBzaW5nbGUgcXVvdGVzIGFuZCByZXBsYWNlIHRoZW0gd2l0aCBkb3VibGUgcXVvdGVzIGV4Y2VwdCBzdHJpbmcgd2hpY2hcbiAgICAgICAgICogYXJlIHBhcnQgb2YgdGhlIHByb3BlcnR5IHN0cmluZy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZXNjYXBlU3RyaW5nRm9ySlNPTihzdHJpbmcpIHtcbiAgICAgICAgICAgIHZhciBzID0gc3RyaW5nXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xce1xccypcXCcvZywne1wiJykucmVwbGFjZSgvXFwnXFxzKlxcfS9nLCdcIn0nKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC86XFxzKlxcJy9nLCc6XCInKS5yZXBsYWNlKC9cXCdcXHMqOi9nLCdcIjonKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8sXFxzKlxcJy9nLCcsXCInKS5yZXBsYWNlKC9cXCdcXHMqLC9nLCdcIiwnKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFtcXHMqXFwnL2csJ1tcIicpLnJlcGxhY2UoL1xcJ1xccypcXF0vZywnXCJdJyk7XG4gICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVzY2FwZVN0cmluZ0ZvckpTT05BcnJheShzdHJpbmcpIHtcbiAgICAgICAgICAgIHZhciBzID0gc3RyaW5nXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyxcXHMqXFwnL2csJyxcIicpLnJlcGxhY2UoL1xcJ1xccyosL2csJ1wiLCcpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcW1xccypcXCcvZywnW1wiJykucmVwbGFjZSgvXFwnXFxzKlxcXS9nLCdcIl0nKTtcbiAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2FsbE1ldGhvZFF1ZXVlKHF1ZXVlKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24gcmVkdWNlKCkge1xuICAgICAgICAgICAgICAgIHZhciBmYyA9IHF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgICAgIGlmIChmYykge1xuICAgICAgICAgICAgICAgICAgICBmYygpO1xuICAgICAgICAgICAgICAgICAgICByZWR1Y2UoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oKSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwYXJzZU5vZGUobm9kZSwgbmFtZSwgY2IpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcywgZ2RNb2R1bGVDaGlsZHJlbiA9IFtdLnNsaWNlLmNhbGwobm9kZS5xdWVyeVNlbGVjdG9yQWxsKCdbJyArIG5hbWUgKyAnLW1vZF0nKSksIHByZXBhcmVSZWFkeVF1ZXVlID0ge307XG5cbiAgICAgICAgICAgIGdkTW9kdWxlQ2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGUgPSBub2RlLmdldEF0dHJpYnV0ZShuYW1lICsgJy1tb2QnKSwgYXR0ciwgdmlld1BhcnQsIGF0dHJpYnV0ZXMsIGNhbm55VmFyO1xuXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlcyA9IGF0dHJpYnV0ZS5zcGxpdCgnICcpO1xuXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChtb2R1bGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0W21vZHVsZU5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5nZXRBdHRyaWJ1dGUobmFtZSArICctbW9kJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5nZXRBdHRyaWJ1dGUobmFtZSArICctJyArIG1vZHVsZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbm55VmFyID0gbm9kZS5nZXRBdHRyaWJ1dGUobmFtZSArICctJyArIG1vZHVsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbm55VmFyID0gbm9kZS5nZXRBdHRyaWJ1dGUobmFtZSArICctdmFyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYW5ueVZhcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW1wbGUgSlNPTiB0ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXFx7XFxzKlxcJ3xcXFwiLio6LipcXH0vLnRlc3QoY2FubnlWYXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyID0gZXNjYXBlU3RyaW5nRm9ySlNPTihjYW5ueVZhcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb3VsZCBiZSBhIEpTT05cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld1BhcnQgPSBKU09OLnBhcnNlKGF0dHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiY2FubnkgY2FuJ3QgcGFyc2UgcGFzc2VkIEpTT04gZm9yIG1vZHVsZTogXCIgKyBtb2R1bGVOYW1lLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXFxbXFxzKlxcJ3xcXFwiLipcXCd8XFxcIlxcXS8udGVzdChjYW5ueVZhcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIgPSBlc2NhcGVTdHJpbmdGb3JKU09OQXJyYXkoY2FubnlWYXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3UGFydCA9IEpTT04ucGFyc2UoYXR0cik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJjYW5ueSBjYW4ndCBwYXJzZSBwYXNzZWQgSlNPTiBmb3IgbW9kdWxlOiBcIiArIG1vZHVsZU5hbWUsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld1BhcnQgPSBjYW5ueVZhcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhcyBtb2R1bGUgYSByZWFkeSBmdW5jdGlvbiB0aGFuIHNhdmUgaXQgZm9yIGNhbGxpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0W21vZHVsZU5hbWVdLmhhc093blByb3BlcnR5KCdyZWFkeScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyBvciBjYWxsIGl0IGltbWVkaWF0ZWx5P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXBhcmVSZWFkeVF1ZXVlW21vZHVsZU5hbWVdID0gdGhhdFttb2R1bGVOYW1lXS5yZWFkeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Lmhhc093blByb3BlcnR5KG1vZHVsZU5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdFttb2R1bGVOYW1lXS5hZGQobm9kZSwgdmlld1BhcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdjYW5ueSBwYXJzZTogbW9kdWxlIHdpdGggbmFtZSDCtCcgKyBtb2R1bGVOYW1lICsgJ8K0IGlzIG5vdCByZWdpc3RlcmVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gYWRkIHJlYWR5IGNhbGxiYWNrIHRvIG1vZHVsZVF1ZXVlXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhwcmVwYXJlUmVhZHlRdWV1ZSkuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZVF1ZXVlLnB1c2gocHJlcGFyZVJlYWR5UXVldWVbbmFtZV0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjYiAmJiBjYigpO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uIGNhbm55RG9tTG9hZCgpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBjYW5ueURvbUxvYWQpO1xuXG4gICAgICAgICAgICBwYXJzZU5vZGUuYXBwbHkoY2FubnksIFtkb2N1bWVudCwgJ2Nhbm55J10pO1xuXG4gICAgICAgICAgICBjYWxsTWV0aG9kUXVldWUobW9kdWxlUXVldWUpO1xuICAgICAgICAgICAgLy8gY2FsbCByZWdpc3RlcmVkIHJlYWR5IGZ1bmN0aW9uc1xuICAgICAgICAgICAgcmVhZHlRdWV1ZUluaXQgPSB0cnVlO1xuICAgICAgICAgICAgY2FsbE1ldGhvZFF1ZXVlKHJlYWR5UXVldWUpO1xuICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFkZCA6IGZ1bmN0aW9uIChuYW1lLCBtb2R1bGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbW9kdWxlQXBpID0gbW9kdWxlO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlQXBpID0gbW9kdWxlKHRoaXMpOyAvLyBpbml0aWFsaXplIHRoZSBtb2R1bGUgd2l0aCB0aGUgYWN0dWFsIGNhbm55IGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpc1tuYW1lXSA9IG1vZHVsZUFwaTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdjYW5ueTogVHJ5IHRvIHJlZ2lzdGVyIG1vZHVsZSB3aXRoIG5hbWUgJyArIG5hbWUgKyAnIHR3aWNlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlYWR5IDogZnVuY3Rpb24gKGZjKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZWFkeVF1ZXVlSW5pdCkge1xuICAgICAgICAgICAgICAgICAgICByZWFkeVF1ZXVlLnB1c2goZmMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZjKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbm55UGFyc2UgOiBmdW5jdGlvbiAobm9kZSwgbmFtZSwgY2IpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIG5lZWRzIGEgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IgPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICBuYW1lID0gXCJjYW5ueVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJzZU5vZGUuYXBwbHkodGhpcyB8fCBjYW5ueSwgW25vZGUsIG5hbWUgfHwgJ2Nhbm55JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsTWV0aG9kUXVldWUobW9kdWxlUXVldWUpO1xuICAgICAgICAgICAgICAgICAgICBjYiAmJiBjYigpO1xuICAgICAgICAgICAgICAgIH1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KCkpO1xuICAgIC8vIGV4cG9ydCBhcyBtb2R1bGUgb3IgYmluZCB0byBnbG9iYWxcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmhhc093blByb3BlcnR5KCdleHBvcnRzJykpIHsgbW9kdWxlLmV4cG9ydHMgPSBjYW5ueTsgfSBlbHNlIHtnbG9iYWwuY2FubnkgPSBjYW5ueTsgfVxufSh0aGlzKSk7Il19
