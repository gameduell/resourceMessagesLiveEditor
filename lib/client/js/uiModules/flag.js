/**
 * handles all texts
 */
var domOpts = require('dom-opts'),
    flagMap = {
        da: 'dk',
        de: 'de',
        fr: 'fr',
        nl: 'nl',
        en: 'us',
        en_GB: 'gb',
        sv: 'se',
        es: 'es'
    };

function getLang(lang) {
    var flagLang = lang;
    if (flagMap.hasOwnProperty(lang)) {
        flagLang = flagMap[lang];
    }
    return flagLang;
}

module.exports = {
    getFlag : function (lang) {
        return domOpts.createElement('span', null, 'flag-icon flag-icon-' + getLang(lang));
    },
    getFlagClasses : function (lang) {
        return ['flag-icon', 'flag-icon-' + getLang(lang)];
    },
    getFlagMap: flagMap,
    getLang: getLang
};