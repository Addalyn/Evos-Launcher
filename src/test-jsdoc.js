/**
 * @fileoverview This is a test file for JSDoc parsing
 * @author Test Author
 * @since 1.0.0
 */

/**
 * This is a test function that does something
 * @param {string} input - The input parameter
 * @param {number} count - The count parameter
 * @returns {boolean} Returns true if successful
 */
function testFunction(input, count) {
  return input && count > 0;
}

/**
 * Another test function
 * @param {Object} options - Configuration options
 * @param {string} options.name - The name
 * @param {number} options.value - The value
 * @returns {void}
 */
export function anotherTest(options) {
  console.log(options.name, options.value);
}
