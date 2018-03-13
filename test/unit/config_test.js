
var config_manager = require('../../server/api/config/config_manager.js');

var config_manager2 = require('../../server/api/config/config_manager.js');

console.log(config_manager.getConfig());
console.log('####################');
console.log(config_manager.getConfig());
console.log('####################');
console.log(config_manager2.getConfig());