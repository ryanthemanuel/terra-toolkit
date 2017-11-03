'use strict';

var _AxeService = require('./AxeService');

var _AxeService2 = _interopRequireDefault(_AxeService);

var _TerraService = require('./TerraService');

var _TerraService2 = _interopRequireDefault(_TerraService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports.Axe = new _AxeService2.default();
module.exports.Terra = new _TerraService2.default();