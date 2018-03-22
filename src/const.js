import { argv } from 'yargs'
import path from 'path'

export const HOME_USER_PATH_FOR_BASH = (process.env.APPDATA || '$HOME')
export const HOME_USER_PATH_FOR_SCRIPTS = (process.env.APPDATA || process.env.HOME)
export const GORILLAJS_PATH = path.resolve(__dirname)
export const PROJECT_PATH = (argv._[0] === 'build' && argv._[1]) ? path.resolve(argv._[1]) : process.cwd()
export const PROJECT_TEMPLATES_OFFICIAL = path.join(GORILLAJS_PATH, 'templates')
export const PROJECT_TEMPLATES_CUSTOM = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'templates')
export const PROJECT_PLUGINS_OFFICIAL = path.join(GORILLAJS_PATH, 'plugins')
export const PROJECT_PLUGINS_CUSTOM = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'plugins')
export const SCHEMA_PATH = path.join(HOME_USER_PATH_FOR_SCRIPTS, 'gorillajs', 'schema.json')
