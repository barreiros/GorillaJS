var path = require('path');
var argv = require('minimist')(process.argv.slice(2));

module.exports = {

    gorillaPath: envPaths.base,
    gorillaFolder: '.gorilla',
    gorillaTemplateFolder: 'template',
    gorillaFile: 'gorillafile',
    messagesFile: 'messages',
    projectPath: process.cwd(),
    homeUserPath: (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library' : '/var/local')),
    hostsFile: process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts',
    commonPath: path.join(process.cwd(), '.gorilla', 'common'),
    workingPath: process.cwd(),
    composeFile: 'docker-compose.yml',
    proxyName: 'gorillajs',
    proxyHost: 'localhost',
    env: argv.e ? argv.e : 'local',
    verbose: argv.d ? argv.d : false,
    templateOptions: ['Django', 'HTML5', 'NodeJS', 'Opencart', 'Wordpress', 'External repository', 'Local folder'],
    templateRepos: {
        'django': 'https://github.com/barreiros/GorillaJS-Django.git',
        'html5': 'https://github.com/barreiros/GorillaJS-HTML5',
        'nodejs': 'https://github.com/barreiros/GorillaJS-NodeJS',
        'opencart': 'https://github.com/barreiros/GorillaJS-Opencart',
        'proxy': 'https://github.com/barreiros/GorillaJS-Proxy',
        'wordpress': 'https://github.com/barreiros/GorillaJS-Wordpress'
    }

}
