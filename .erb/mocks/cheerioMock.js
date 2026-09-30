const cheerioMock = {
  load: () => () => ({
    text: () => '',
    html: () => '',
    attr: () => '',
    find: () => ({ text: () => '', attr: () => '' }),
  }),
};

module.exports = cheerioMock;
module.exports.default = cheerioMock;
