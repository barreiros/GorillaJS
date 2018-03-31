import { argv } from 'yargs'
import path from 'path'

export const HOME_USER_PATH_FOR_BASH = (process.env.APPDATA || '$HOME')
export const HOME_USER_PATH_FOR_SCRIPTS = (process.env.APPDATA || process.env.HOME)

export const GORILLAJS_PATH = path.resolve(__dirname)
export const DATA_PATH = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'data')
export const PROXY_PATH = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'proxy')
export const PROJECT_PATH = argv.path ? path.resolve(argv.path) : process.cwd()
export const LICENSE_PATH = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'license.txt')

export const PROJECT_ENV = argv.env ? argv.env : 'local'
export const PROJECT_IS_LOCAL = argv.public ? false: true
export const PROJECT_TEMPLATES_OFFICIAL = path.join(GORILLAJS_PATH, 'templates')
export const PROJECT_TEMPLATES_CUSTOM = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'templates')
export const PROJECT_PLUGINS_OFFICIAL = path.join(GORILLAJS_PATH, 'plugins')
export const PROJECT_PLUGINS_CUSTOM = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'plugins')

export const SYSTEM_HOSTS_FILE = process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts'
export const SCHEMA_PATH = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'schema.json')
export const DEBUG = argv.d ? true : false
