// import { PROJECT_ENV, HOME_USER_PATH_FOR_SCRIPTS as HOME } from '../../const.js'
// import { events } from '../../class/Tools.js'
// import { load } from 'yamljs'
//
// class Adminer{
//
//     constructor(){
//
//         events.subscribe('PROJECT_BUILT', this.check)
//
//     }
//
//     check(){
//
//     }
//
//     add(){
//
//         // Cargo el archivo de configuración de Ademiner y compruebo si el proyecto actual ya existe.
//
//         // Si no existe, inicio el proceso.
//             // Cargo el archivo docker-compose.
//             // Creo un array con los motores de adminer.
//             let engines = ['mysql', 'mariadb', 'sqlite', 'postgresql', 'mongodb', 'oracle', 'elasticsearch'];
//             // Lo parseo en busca de servicios que tengan en el nombre alguna de las cadenas del array "engines"
//             // Incluyo los servicios de base de datos que haya encontrado en el archivo de configuración de Adminer.
//             // Copio los archivos de Adminer en el contenedor del proxy.
//
//         // Si existe, no hago nada.
//
//     }
//
// }
//
//
// export default new Adminer() 
//
//     addAdminer(){
//
//         var list, listPath, composePath, dataPath, domain, output;
//
//         composePath = path.join(variables.projectPath, variables.gorillaFolder, variables.gorillaTemplateFolder, variables.composeFile);
//         dataPath = path.join(variables.homeUserPathBash, variables.proxyName, 'data');
//         domain = gorillaData.local.project.domain;
//         listPath = path.join(variables.homeUserPathNodeJS, variables.proxyName, 'adminer', 'list.json');
//
//         // Recupero la ruta del archivo docker-compose.
//         yaml.load(composePath, function(compose){
//
//             var engines = ['mysql', 'mariadb', 'sqlite', 'postgresql', 'mongodb', 'oracle', 'elasticsearch'];
//
//             if(compose.hasOwnProperty('services')){
//
//                 // Cargo el archivo con la lista de containers con base de datos de los dominios.
//                 list = loadList(listPath);
//                 list[domain] = {};
//
//                 // Parseo el archivo docker-compose y busco en cada servicio y si tiene un volumen apuntando a la carpeta data_path, incluyo el contenedor a la lista.
//                 for(var service in compose.services){
//
//                     if(compose.services[service].hasOwnProperty('volumes')){
//
//                         for(var volume in compose.services[service].volumes){
//
//                             if(compose.services[service].volumes[volume].indexOf(dataPath) > -1){
//
//                                 // Busco el nombre del motor de base de datos. Para que funcione tiene que contener el nombre del motor en el nombre del contenedor.
//                                 for(var engine in engines){
//
//                                     if(compose.services[service].container_name.search(engines[engine]) !== -1){
//
//                                         // Añado el contenedor al listado.
//                                         list[domain][compose.services[service].container_name] = engines[engine];
//
//                                     }
//
//                                 }
//
//                                 break;
//
//                             }
//
//                         }
//
//                     }
//
//                 }
//
//             }
//
//             // Guardo el archivo de la lista en la carpeta global y en el directorio público que le voy a pasar al proxy.
//             if(list.hasOwnProperty(domain)){
//
//                 output = JSON.stringify(list, null, '\t');
//                 fs.writeFileSync(listPath, output);
//                 fs.writeFileSync(envPaths.plugins + '/adminer/public/list.json', output);
//
//             }
//
//             // Copio los contenidos en el contenedor: script bash y carpeta pública.
//             cross.exec('docker cp "' + envPaths.plugins + '/adminer/public/." gorillajsproxy:/var/www/adminer && docker cp "' + envPaths.plugins + '/adminer/server/." gorillajsproxy:/etc/adminer', function(err, stdout, stderr){
//
//                 if (err) events.publish('ERROR', ['Problem with Adminer Plugin configuration.']);
//                 events.publish('VERBOSE', [err, stderr, stdout]);
//
//                 // Ejecuto el script de bash.
//                 cross.exec('docker exec gorillajsproxy /bin/sh /etc/adminer/adminer.sh', function(err, stdout, stderr){
//
//                     if (err) events.publish('ERROR', ['Problem with Adminer Plugin configuration.']);
//                     events.publish('VERBOSE', [err, stderr, stdout]);
//
//                     events.publish('PROMISEME');
//
//                 });
//
//             });
//
//         });
//
//     }
//
//     loadList(listPath){
//
//         var list;
//
//         fsx.ensureFileSync(listPath);
//
//         list = fs.readFileSync(listPath).toString();
//
//         if(list === ''){
//
//             return {};
//
//         }else{
//
//             return JSON.parse(list);
//
//         }
//
//     }
"use strict";