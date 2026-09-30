const React = require('react');

function MuiColorInput(props) {
  return React.createElement('input', { type: 'color', ...props });
}

module.exports = {
  MuiColorInput,
  default: MuiColorInput,
};
