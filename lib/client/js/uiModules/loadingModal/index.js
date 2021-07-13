module.exports = function () {
  let node;

  return {
    add: (n) => {
      node = n
    },
    show: () => {
      node.classList.add('show');
    },
    hide: () => {
      node.classList.remove('show');
    },
  };
};
