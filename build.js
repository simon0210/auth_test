const s = require('shelljs');

s.rm('-rf', 'build');
s.mkdir('build');
s.cp('.env', 'build/.env');
s.cp('-R', 'public', 'build/public');
s.cp('process.yml', 'build/process.yml');
s.mkdir('-p', 'build/server/common/swagger');
s.mkdir('-p', 'build/server/api/config');

s.cp('server/common/swagger/Api.yaml', 'build/server/common/swagger/Api.yaml');
s.cp('-R', 'server/api/config/*', 'build/server/api/config');
