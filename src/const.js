import { argv } from 'yargs'
import path from 'path'

export const PROJECT_PATH = (argv._[0] === 'build' && argv._[1]) ? path.resolve(argv._[1]) : process.cwd()
