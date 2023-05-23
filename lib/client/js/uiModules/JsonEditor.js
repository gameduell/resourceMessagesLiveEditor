/**
 * shows the uploader form to upload a image to the server
 */
var onSubmitListener = function () {},
    onLoadListener = function () {},
    onCloseListener = function () {},
    renderKeyWarnings = function () {},
    root,
    textarea,
    checkboxSafety,
    warnings,
    brain = {
        root: {
            init: function (node) {
                root = node
                root.addEventListener('click', onClickRoot)
            },
        },
        textarea: {
            init: function (node) {
                node.addEventListener('focus', function () {
                    root.classList.remove('error')
                })
                textarea = node
            },
        },
        checkboxSafety: {
            init: function (node) {
                checkboxSafety = node
            },
        },
        warnings: {
            init: function (node) {
                warnings = node
            },
        },
        btnCloseWarnings: {
            init: function (node) {
                node.addEventListener('click', function () {
                    warnings.classList.remove('show')
                })
            },
        },
        btnLoad: {
            init: function (node) {
                node.addEventListener('click', onClickLoadBtn)
            },
        },
        btnSave: {
            init: function (node) {
                node.addEventListener('click', onClickSubmitBtn)
            },
        },
        btnClose: {
            init: function (node) {
                node.addEventListener('click', onClickCloseBtn)
            },
        },
    }

function onClickLoadBtn(event) {
    event.preventDefault()
    onLoadListener(function (data) {
        textarea.value = JSON.stringify(data, null, 2)
    })
}

function onClickSubmitBtn(event) {
    event.preventDefault()
    if (textarea.value) {
        try {
            var data = JSON.parse(textarea.value)
            onSubmitListener(data, {
                preventOverride: checkboxSafety.checked === false,
            })
        } catch (err) {
            root.classList.add('error')
        }
    } else {
        root.classList.add('error')
    }
}

function onClickCloseBtn(event) {
    event.preventDefault()
    onCloseListener()
}

function onClickRoot(event) {
    if (event.target === event.currentTarget) {
        onCloseListener()
    }
}

function reset() {
    textarea.value = ''
    checkboxSafety.checked = false
    root.classList.remove('error')
}

/**
 *
 * @returns {{add: Function, ready: Function}}
 */
module.exports = {
    add: function (node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr].init(node)
        }
    },
    setRenderKeyWarnings: function (func) {
        renderKeyWarnings = func
    },
    showKeyWarnings: function (data) {
        renderKeyWarnings(data)
        warnings.classList.add('show')
        root.classList.add('error')
    },
    setLoadListener: function (fc) {
        onLoadListener = fc
    },
    setSubmitListener: function (fc) {
        onSubmitListener = fc
    },
    setCloseListener: function (fc) {
        onCloseListener = fc
    },
    reset: reset,
}
