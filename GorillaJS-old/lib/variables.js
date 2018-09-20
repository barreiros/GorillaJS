var path = require('path');
var argv = require('minimist')(process.argv.slice(2));

module.exports = {

    stateOfProject: 'normal',
    gorillaPath: envPaths.base,
    gorillaFolder: '.gorilla',
    gorillaTemplateFolder: 'template',
    gorillaFile: 'gorillafile',
    messagesFile: 'messages',
    projectPath: process.cwd(),
    homeUserPathBash: (process.env.APPDATA || '$HOME'),
    homeUserPathNodeJS: (process.env.APPDATA || process.env.HOME),
    hostsFile: process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts',
    commonPath: path.join(process.cwd(), '.gorilla', 'common'),
    workingPath: process.cwd(),
    composeFile: 'docker-compose.yml',
    proxyName: 'gorillajs',
    proxyHost: 'localhost',
    env: argv.e ? argv.e : 'local',
    verbose: argv.d ? argv.d : false,
    // templateOptions: ['Django', 'PHP-7', 'NodeJS', 'Opencart', 'Wordpress', 'External repository', 'Local folder'],
    templateOptions: ['Wordpress', 'PHP-7', 'Django', 'NodeJS', 'External repository', 'Local folder'],
    templateRepos: {
        'proxy': 'https://github.com/barreiros/GorillaJS-Proxy',
        'wordpress': 'https://github.com/barreiros/GorillaJS-Wordpress',
        'php7': 'https://github.com/barreiros/GorillaJS-PHP-7',
        'django': 'https://github.com/barreiros/GorillaJS-Django.git',
        'nodejs': 'https://github.com/barreiros/GorillaJS-NodeJS'
        // 'opencart': 'https://github.com/barreiros/GorillaJS-Opencart',
    },
    pluginsWebService: 'https://gorillajs.com/wp-json',
    ua: 'UA-85486457-1'

}
