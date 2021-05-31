var onSearch = function () {console.log('search:onSearch is not handled')},
    active = false,
    rootNode,
    inputNode,
    brain = {
        root: function(node) {
            rootNode = node;
        },
        input : function (node) {
            inputNode = node;
            node.addEventListener('keyup', function(event) {
                event.preventDefault();
                if (active && event.keyCode === 13) {
                    onSearch();
                }
            });
        },
        button : function (node) {
            node.addEventListener('click', function(event) {
                if (active) {
                    onSearch();
                }
            });
        }
    };

module.exports = {
    onSearch : function(fc) {
        onSearch = fc;
    },
    get inputNode() {
        return inputNode;
    },
    add : function(node, attr) {
        if (brain.hasOwnProperty(attr)) {
            brain[attr](node);
        }
    },
    show : function() {
        rootNode.classList.add('show');
        active = true;
    },
    hide : function() {
        active = false;
        rootNode.classList.remove('show');
    }
};