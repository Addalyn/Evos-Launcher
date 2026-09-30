const React = require('react');

function ReactMarkdownMock({ children }) {
  return React.createElement('div', { 'data-testid': 'markdown' }, children);
}

module.exports = ReactMarkdownMock;
module.exports.default = ReactMarkdownMock;
