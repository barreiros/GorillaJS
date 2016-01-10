Recordatorio para configurar el API remote de Docker:
===
Para iniciar el API remote de Docker uso la librería socat porque me facilita redireccionar el puerto al socket de Docker sin que eso interfiera en el funcionamiento de los contenedores.
socat -d -d TCP-LISTEN:4242,fork UNIX:/var/run/docker.sock 
¡Tengo que ver cómo volver a crear el enlace, porque ahora cuando termino el proceso y lo vuelvo a arrancar, me dice que está ocupado. 
sudo netstat -nlp | grep ${PORT}

Advertencias en el uso de GorillaJS
===
*Git*
Cuando se clona un repositorio solo se clonan los contenidos, no el histórico de commits. Los usuarios que no quieran un repositorio limpio solo tienen que usar la clonación de git, sin la ayuda de GorillaJS :-).

*ssh*
Solo se admiten keys para conectarse con los servidores remotos. ¿passwordless?

*Deploy*
Los archivos que no queramos incluir en el proceso tendrán que estar en el archivo .gitignore. 

*Pack*
La rama que usará el método pack será la que le hayamos indicado en la variable branchdevel. Esta rama la ha podido crear el usuario por otras vías distintas a GorillaJS. Por eso, si la rama no existe, la creará GorillaJS. La idea de esto es dar flexibilidad al usuario y que pueda ir eligiendo ramas que quiera desplegar para cada uno de los entornos.


To create Docker images
===
docker build -t gorillajs/apache-base:latest -f templates/wordpress/dockerfile-apache .


Dependencies:
===
Docker-machine (mac-OSX)
Docker-compose
curl

Arguments list:
===

--e : Set the current environment.
--f : Set the configuration file path.
--g : Create local git repository.
--gr : Create local and remote repository.
--grc : Create local, remote and clone contents from other repository.
--d : Configure Docker environment.


Project configuration file settings:

{
    "local": {
        "project": {
            "name": "GorillaJS_Example",
            "slug": "gorillajs_example",
            "serverfolder": "application"
        },
        "git": {
            "username": "developer",
            "password": "",
            "mainrepo": "https://bitbucket.org/developer/myrepo",
            "clonefrom": ""
        },
        "apache": {
            "vhosturl": "docker.local",
            "vhostdir": "",
            "vhostconfigfile": "/etc/apache2/extra/httpd-vhosts.conf",
            "systemhostsfile": "/etc/hosts",
            "adminemail": ""
        },
        "db": {
            "username": "",
            "password": "",
            "dbname": "",
            "dbhost": "",
            "populatefrom": ""
        },
        "docker": {
            "machinename": "default"
        }
    },
    "staging": {
        "db": {
            "username": "",
            "password": "",
            "dbname": "",
            "dbhost": "",
            "populatefrom": ""
        }
        ...

    }
}


DESARROLLO
===

*init: Configurar un nuevo proyecto.*
-g, -gr, -grc
Crear repositorio en local.
Asignarle un remote.
Crear la rama devel.
Crear el primer commit y subirlo al remoto.

-gr, -grc
Crear un repositorio remoto.

-grc
Clonar los contenidos desde un repositorio. (Tengo que dar la opción de seleccionar la rama que queremos clonar. Si no se indica, será la rama master).
Eliminar los restos de la clonación.

-d
Comprobar si Docker está activo y si tiene instalado docker-compose.
Iniciar los contenedores y configurarlos con docker compose.
Añadir la redirección del dominio a la ip del contenedor en /etc/hosts.

*reconfigure: Métodos para volver a configurar algunas partes del proyecto. Por ejemplo: el archivo de configuración, el archivo de wp-config en wordpress...*


*pack: Preparar la rama master para el despliegue.*
Compilar los estáticos del proyecto.
Pasar los archivos necesarios de la rama devel a master.
Crear un commit en devel con el nombre estandarizado. Por ejemplo, deploy+fecha_actual
Subirlo al remoto.

*start: Iniciar los servicios necesarios.*



PRODUCCIÓN
===

*provision: Aprovisionar la máquina*
-g
Instalar git.

-d
Instalar Docker.
Configurar las máquinas usando una template.


*deploy: Actualizar los archivos en producción.*
Crear un repositorio, si no existe. El árbol de carpetas del servidor tiene que ser como el de desarrollo, es decir, el repositorio va en el raíz y la parte pública va en la carpeta de la aplicación.
Conectarme al servidor por ssh.
Hacer comprobaciones previas en los archivos para evitar problemas, comprobando los permisos de escritura, etc...
Crear un punto de rollback en el repositorio principal.
Crear una copia de la base de datos.
Clonar los contenidos de la rama master en un repositorio temporal.
Actualizar los archivos del servidor por los nuevos que acado de descargar.
Borrar el repositorio temporal.

*rollback: Volver a la versión anterior de los archivos.*
