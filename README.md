*Arguments list:*

--e : Set the current environment.
--f : Set the configuration file path.
--a : Configure Apache server with virtual host.
--l : Create local git repository.
--lr : Create local and remote repository.
--lrc : Create local, remote and clone contents from other repository.
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


*DESARROLLO*

configure: Configurar un nuevo proyecto. 
====
-l, -lr, -lrc
Crear repositorio en local.
Asignarle un remote.
Crear la rama devel.
Crear el primer commit y subirlo al remoto.

-lr, -lrc
Crear un repositorio remoto.

-lrc
Clonar los contenidos de la rama de desarrollo del proyecto base en la rama devel sin heredar el histórico (puedo clonar el repositorio en una carpeta aparte y trabajar desde ahí).
Eliminar los restos de la clonación.

-a
Crear el virtual host de Apache.

-d
Comprobar si Docker está activo y si tiene instalado docker-compose.
Iniciar los contenedores y configurarlos con docker compose.
Añadir la redirección del dominio a la ip del contenedor en /etc/hosts.

pack: Preparar la rama master para el despliegue.
====
Compilar los estáticos del proyecto.
Pasar los archivos necesarios de la rama devel a master.
Crear un commit en devel con el nombre estandarizado. Por ejemplo, deploy+fecha_actual
Subirlo al remoto.

start: Iniciar los servicios necesarios.
====



*PRODUCCIÓN*

deploy: Actualizar los archivos en producción.
====
Crear un repositorio, si no existe. El árbol de carpetas del servidor tiene que ser como el de desarrollo, es decir, el repositorio va en el raíz y la parte pública va en la carpeta de la aplicación.
Conectarme al servidor por ssh.
Hacer comprobaciones previas en los archivos para evitar problemas, comprobando los permisos de escritura, etc...
Crear un punto de rollback en el repositorio principal.
Crear una copia de la base de datos.
Clonar los contenidos de la rama master en un repositorio temporal.
Actualizar los archivos del servidor por los nuevos que acado de descargar.
Borrar el repositorio temporal.

rollback: Volver a la versión anterior de los archivos.
