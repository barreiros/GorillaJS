<p align="center">
  <img src="http://s23.postimg.org/ka5fnkw23/logo_mini.jpg" alt="GorillaJS logo"/>
</p>

> *English version*: I'm translating the documentation. For now, you can read it in Spanish, which is a very nice language.

**GorillaJS es una herramienta basada en Docker que simplifica la creación de entornos de desarrollo web**

# Objetivo y filosofía  

GorillaJS pretende servir de apoyo a los desarrolladores web ahorrándoles tiempo en la ejecución de tareas repetitivas, como podrían ser la configuración e instalación de aplicaciones, la creación de bases de datos o la réplica del proyecto.

Para conseguir esto, GorillaJS utiliza un sistema simple de preguntas y respuestas que va almacenando en el archivo .gorilla/gorillafile y que después utiliza para configurar el proyecto.   
> Es importante saber que, aunque GorillaJS se base en Docker y Nodejs, no es necesario tener ningún conocimiento en estas tecnologías, más allá de la simple instalación de ambas.
  
<p align="center">
    <a href="http://www.youtube.com/watch?feature=player_embedded&v=LKXsY0a4BWo" target="_blank">
        <img src="http://img.youtube.com/vi/LKXsY0a4BWo/0.jpg" alt="How to install Wordpress in 80 seconds" width="50%" height="auto" border="3" />
    </a>
</p>

En este ejemplo GorillaJS usa la [plantilla predefinida de Wordpress](#plantillas-por-defecto) para:
* iniciar los contenedores de Docker
* instalar el entorno LAMP
* crear y configurar la base de datos
* descargar los archivos del repositorio oficial de Wordpress
* instalar Wordpress
* configurar el archivo hosts del ordenador
* abrir el navegador con la url del proyecto.

Todo esto lo consigue con un solo comando y en menos de 2 minutos.

---

##### Instalación

> GorillaJS está en fase beta, y es compatible con Mac y Linux. En un futuro estará disponible en Windows.

GorillaJS se instala desde [npm](https://docs.npmjs.com/getting-started/installing-node) y necesita Docker para funcionar.

```nodejs
npm install -g gorillajs
```

##### Instalar Docker

* [Mac](https://docs.docker.com/docker-for-mac/)
> Es necesario tener instaldo Docker for Mac. Con Docker Toolbox no funciona.

* Linux
> Instalar [Docker](https://docs.docker.com/engine/getstarted/linux_install_help/) y [Docker Compose](https://docs.docker.com/compose/install/). 

* [Windows](https://docs.docker.com/docker-for-windows/)
> Es necesario tener instalado Docker for Windows. Con Docker Toolbox no funciona.

##### Cómo se usa

GorillaJS tiene un solo comando: 

```nodejs
gorilla init [path]
```  

> El path es opcional y si no se indica GorillaJS creará el proyecto en el directorio actual.

Este comando sirve tanto para instalar un proyecto como para iniciarlo. La diferencia es que si se ejecuta *gorilla init [path]* en un directorio en el que ya existe un proyecto de GorillaJS se vuelve a configurar el proyecto con los valores que se guardaron la última vez y se reinician los contenedores de Docker. Para cambiar los valores hay que usar el parámetro -f. 

```nodejs
gorilla init [path] -f
```

> GorillaJS solo sobreescribe archivos de configuración, **nunca borra los archivos del proyecto**.


##### Parámetros

| Nombre | Función             |
| ---    | ---                 |
| -v     | Enable verbose mode |
| -f     | Ask you again       |

# Plantillas por defecto

Por defecto GorillaJS viene con una plantilla para crear proyectos de Wordpress. Para poder usar esta plantilla es necesario aportar los siguientes valores:

* **Select the docker template value from the list above**  
> Por ahora solo se puede elegir entre wordpress o una [plantilla personalizada](#user-content-plantillas-personalizadas).

* **Tell me a name for your project**  
> Un nombre identificativo para el proyecto. Algo corto.

* **How do you prefer to access your site, through domain name or ip?**  
> Con GorillaJS se puede elegir cómo acceder al sitio del proyecto. Si se selecciona *domain*, aparecen además estos otros valores:

 * **Tell me your local project url**  
> El nombre de dominio a través del cual se quiere acceder al site. Hay que poner solo el nombre: sin http://, ni https://.
 
 * **Enter the system hostsfile value**  
> La ruta absoluta del archivo hosts del ordenador desde el que se está ejecutando GorillaJS. Para más información sobre [dónde encontrar](https://en.wikipedia.org/wiki/Hosts_file la ruta del archivo hosts).

* **What is your public folder?**  
> La carpeta pública en la que irán los archivos de Wordpress. Si ya existe una carpeta con los archivos, GorillaJS no la sobreescribe: usa esa misma carpeta, respetando los contenidos.

* **The data base name**

* **The data base user name**

* **The data base password**  
> Es muy importante saber que si ya existe un proyecto de Wordpress previo, como GorillaJS no sobreescribe los archivos, la configuración de estos tres últimos valores tiene que seguir igual que la del archivo wp-config, y en este archivo es necesario cambiar el valor de la constante DB_HOST a *mysql*.

* **Where do you want to store the data base files**  
> Docker necesita una carpeta en la que guardar los datos de la base de datos porque, por naturaleza, los borra cada vez que se apaga el contenedor. Esta carpeta se usa para salvar esos datos y no perderlos. Es uno de los dos [*volumes*](https://docs.docker.com/engine/tutorials/dockervolumes/) que usa esta plantilla. El otro es la carpeta pública en la que van los archivos de Wordpress.


# Plantillas personalizadas

> Esta parte solo es para los usuarios que quieran hacer una plantilla personalizada, y requiere conocimientos avanzados de Docker.

Además de las plantillas que trae por defecto, GorillaJS permite crear plantillas personalizadas. El único requisito para crear una plantilla es que ésta debe tener un archivo *docker-compose.yml*. [Aquí hay más información sobre Docker Compose](https://docs.docker.com/compose/).
Por ejemplo, la plantilla de Wordpress, que está en .../templates/wordpress/ utiliza varios archivos a lo largo del proceso de configuración. 

| Nombre                            | Función                                                                                                                                                                                                                       |
| ---                               | ---                                                                                                                                                                                                                           |
| apache-httpd.conf                 | Se usa una vez iniciados los contenedores, para sobreescribir la configuración por defecto de Apache.                                                                                                                         |
| apache-init.conf                  | Se usa al iniciar Apache y se encarga de descargar Wordpress del repositorio oficial y de instalarlo a través de WP-CLI. También se encarga de configurar el archivo wp-config y de renombrar el dominio, si fuera necesario. |
| apache-vhost.conf                 | Se usa para crear el virtualhost dentro del contenedor de Apache.                                                                                                                                                             |
| docker-compose.yml                | Generar los contenedores de Docker (Apache y MySQL) y los volúmenes en los que va la aplicación y los datos persistentes de mysql.                                                                                            |
| gorillafile                       | Se usa para pasarle a GorillaJS valores de configuración iniciales de plantilla. [Más información](#user-content-archivo-gorillafile).                                                                                        |
| messages                          | Se usar para indicarle a GorillaJS qué debe preguntar para conseguir un valor. [Más información](#user-content-archivo-messages).                                                                                             |
| mysql-debian.cnf, mysql-init.conf | Son archivos de configuración de mysql, como Apache.                                                                                                                                                                          |
| php-php5-fpm.conf                 | Configuración inicial de php-fpm.                                                                                                                                                                                             |
| waiting.html                      | Se usa en lugar del index.html que viene por defecto en Apache.                                                                                                                                                               |

Estos archivos están en la plantilla porque, de alguna manera, se encargan de la configuración de una parte del proyecto que debe ser única. Por ejemplo, el virtualhost de Apache: 

```bash

<VirtualHost *:80>

    Servername {{project.domain}}

    DocumentRoot /var/www/{{project.domain}}/{{project.srcout}}

    ErrorLog /var/log/apache2/{{project.domain}}-error.log
    CustomLog /var/log/apache2/{{project.domain}}-access.log combined
  
    <Directory /var/www/{{project.domain}}/{{project.srcout}}>
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Order allow,deny
        allow from all
    </Directory>

</VirtualHost>

```

En este archivo los valores de ServerName, DocumentRoot, etc... tienen que ser únicos, por razones obvias. De otra manera, si se quisiera acceder al proyecto a través del nombre de dominio, y las configuraciones no fuera únicas, el host no sabría qué proyecto mostrar. Esto, como ya se ha dicho antes, es opcional; pues en este ejemplo en concreto se podría acceder a través de ip y dejar la configuración por defecto de Apache.  

#### Uso de variables en la plantilla.

GorillaJS recorre todos los archivos que hay en la carpeta de la plantilla para localizar variables y poder asignarles los valores que hay en el archivo [*gorillafile*](#user-content-archivo-gorillafile). Estas variables siguen un marcado específico: siempre van encerradas entre {{}}. Por ejemplo: 

```bash
{{NOMBRE_DE_LA_VARIABLE}}  
```

También se puede agrupar usando el marcado:

```bash
{{NOMBRE_DEL_GRUPO.NOMBRE_DE_LA_VARIABLE}}
```

GorillaJS solo reconoce hasta un segundo nivel de profundidad. El siguiente ejemplo no será válido:

```bash
{{NOMBRE_DEL_GRUPO.NOMBRE_DE_LA_VARIABLE.NOMBRE_DE_OTRA_VARIABLE}}

```

> GorillaJS recorre los archivos cada vez que ejecutamos el comando *gorilla init*, es decir, siempre que se inicia el proyecto. 

#### Archivo gorillafile

La plantilla puede traer un archivo gorillafile por defecto. Los valores que se pongan en este archivo se complementarán con los generados por el sistema de preguntas y respuestas.  
Siguiendo con el ejemplo de la plantilla de Wordpress, el archivo gorillafile que se genera a través de esa plantilla sería algo así:

```bash

"local": {
    "docker": {
        "gorillafolder": ".gorilla",
        "templatefolder": "template",
        "template": "wordpress",
        "port": 4815
    },
    "project": {
        "slug": "veryease",
        "domain": "veriease.local",
        "srcout": "application",
        "datafolder": "application-db"
    },
    "apache": {
        "adminemail": "test@yourdomain.com"
    },
    "database": {
        "dbname": "veryeasedb",
        "username": "veryeaseuser",
        "password": "1234"
    },
    "host": {
        "enabled": "domain"
    }
}

```
> Al estar en formato json, se pueden cambiar los valores del fichero, guardar y volver a ejecutar gorilla init para cambiar la configuración del proyecto.

El archivo gorillafile puede servir para dos propósitos:
* Sugerir valores por defecto a las preguntas que se le muestran al usuario.
* Asignar un valor predeterminado a una variable y evitar que se le pregunte al usuario por ella (esto será así mientras el usuario no ejecute gorilla con la opción -f).

**Sugerir valores**
Para sugerir valores, éstos tienen que ir en un árbol que empieze con el valor *default*. Por ejemplo:

```bash

"default": {
    "database": {
        "name": "application-db",
        "user": "gorilla.local"
    },
    "system": {
        "hostsfile": "/etc/hosts"
    },
    ...

```

**Asignar valores**
Para asignar valores, éstos tienen que ir en un árbol que empieze con el valor *local*. Por ejemplo:

```bash

"local": {
    "project": {
        "datafolder": "application-db",
        "domain": "gorilla.local"
    },
    ...

```

De esta manera, se podría crear un archivo gorillafile en la plantilla que fuera algo así:

```bash

{
    "local": {
        "project": {
            "datafolder": "application-db",
            "domain": "gorilla.local"
        }
    },
    "default": {
        "database": {
            "name": "application-db",
            "user": "gorilla.local"
        },
        "system": {
            "hostsfile": "/etc/hosts"
        }
    }
}

```
De esta forma, si hay un archivo en la plantilla con las variables {{database.name}} GorillaJS le sugerirá al usuario que use el valor *application-db*, mientras que si en la plantilla hay una variable {{project.domain}}, GorillaJS no le preguntará nada al usuario y rellenará ese varaible con el valor *gorilla.local*, a menos que el usuario haya ejecutado gorilla init -f, en cuyo caso solo le sugerirá usar el valor *gorilla-local*.

#### Archivo messages

También se puede personalizar el texto de la pregunta que GorillaJS le muestra al usuario. Para hacer esto se usa el archivo *messages* que, al igual que el archivo gorillafile, está en formato json.  
Un ejemplo de archivo message sería este:

```bash
{
    "questions": {
        "database": {
            "name": "Please, enter the data base name. Just letters and numbers, no special characters",
            "user": "Please, enter the user data base"
        }
    }
}

```

Esta vez el árbol tiene que empezar con el valor "questions", seguido de la ruta a las variables a las que se le quiere cambiar la pregunta. Si no hay ninguna pregunta, el formato será el que viene por defecto en GorillaJS: 

*"Please, enter the NOMBRE_DEL_GRUPO NOMBRE_DE_LA_VARIALBE value."*
