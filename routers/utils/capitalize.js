/**
 * Capitalize the first letter of each word in a string
 * @param {String} string The string(s)
 */
const capitalize = (string) => {
    let strings = string.split(' ');
    let newString = [];

    for (let string of strings) {
        let capitalized = string.charAt(0).toUpperCase() + string.slice(1);
        newString.push(capitalized);
    }

    return newString.toString().replace(/,/g, ' ');
}

module.exports = capitalize;