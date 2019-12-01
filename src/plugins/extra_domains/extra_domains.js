import { PROJECT_ENV } from '../../const.js'
import Project from '../../class/Project.js'
import { addToHosts } from '../../class/Tools.js'
import { readFileSync, writeFileSync } from 'fs'
import { events } from '../../class/Events.js'
import { argv } from 'yargs'
import JSPath from 'jspath'

class ExtraDomains{

    constructor(){

        events.subscribe( 'AFTER_REPLACE_VALUES', this.addDomains )

        this.init( )

    }

    init( ) {

        if(argv._[0] === 'domain'){

            if(argv._[1] === 'extra'){

                this.saveDomain( argv._[2] )

            }

        }

    }

    saveDomain( domain ) {

        let project = new Project()
        let config = project.config

        if( config.hasOwnProperty( 'alias' ) ) {

            if( ! config[ PROJECT_ENV ].alias.indexOf( domain ) ) {

                let alias = config.alias

                config[ PROJECT_ENV ].alias.push( domain )

            }

            console.log( 'This domain already exists in the project' )

        } else {

            config[ PROJECT_ENV ].alias = [ domain ]

        }

        project.saveValue( config )
        
        addToHosts( domain, ( ) => {
        
            console.log( 'Please, rebuild the project to install the new domain' )

        } );

    }

    addDomains( config, templateTarget, proxyTarget ) {

        if( config.hasOwnProperty( 'alias' ) ) {

            let file = readFileSync( proxyTarget + '/apache-proxy.conf' ).toString()

            for( let domain of config.alias ) {

                let position = file.indexOf( 'ServerAlias' )

                file = [ file.slice( 0, position ), 'ServerAlias ' + domain + '\r\n\t', file.slice( position ) ].join( '' )


            }

            writeFileSync( proxyTarget + '/apache-proxy.conf', file )

        }
    }

}

export default new ExtraDomains() 
