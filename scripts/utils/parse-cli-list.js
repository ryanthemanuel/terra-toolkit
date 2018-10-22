// eslint-disable-next-line no-useless-escape
const parseCLIList = list => list.replace(/[\[\'\'\]\s], '').split(',').map(String);

module.exports = parseCLIList;
