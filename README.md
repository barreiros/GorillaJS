<p align="center">
  <img src="http://s23.postimg.org/ka5fnkw23/logo_mini.jpg" alt="GorillaJS logo"/>
</p>

**GorillaJS es una herramienta que ayuda a automatizar de manera sencilla tareas complejas del desarrollo web.**

### Objetivo y filosofía
GorillaJS pretende servir como apoyo en el flujo de trabajo habitual del desarrollador, ayudándole a realizar algunas de las tareas más comunes y repetitivas de ese flujo.
Para hacer esto, GorillaJS utiliza una interfaz sencilla (CLI) basada en preguntas simples relacionadas con la tarea que se va a realizar y guarda las respuestas para poder automatizarla la próxima vez.

Está pensado para adaptarse a todo tipo de desarrolladores y quiere alejarse de complejas herramientas de desarrollo y exigentes arquitecturas. Cada desarrollador puede elegir en cada momento qué necesita usar de GorillaJS, y qué no: GorillaJS no es un framework y tampoco una herramienta de integración continua.

Con GorillaJS se puede:
* Levantar máquinas de desarrollo independientes para cada proyecto. En tu máquina **local** y en servidores **remotos**.
* Clonar repositorios Git sin heredar el histórico. Tanto **locales** como **remotos**.
* Crear repositorios públicos y privados en **Gitlab**, **Github** y **Bitbucket**.
* Desplegar versiones en servidores remotos (**deploy**).
* Revertir los cambios en cualquier momento (**rollback**).

**Su mayor potencial está en iniciar, mantener y automatizar estas tareas**, usando herramientas como **Git**, **Docker** o **SSH** y comunicándose con los servidores remotos (cuando lo necesita) a través de comandos simples que reciben la infomación lo más procesada posible para cada tarea.

### Instalación
```shell
npm install -g gorillajs
```

### Listado de tareas
* [deploy](#user-content-deploy)
* [rollback](#user-content-rollback)
* [docker](#user-content-docker)
* [clonerepo](#user-content-clonerepo)
* [createrepo](#user-content-createrepo)

******

deploy
---
```shell
gorilla deploy -e [environment]
```
Despliega en el servidor remoto los archivos que estén en el último commit de la rama deploy.

GorillaJS necesita dos ramas del repositorio git para poder crear los despliegues: la rama deploy [gorilla-deploy] y la rama devel [gorilla-devel].<br />
La rama deploy la crea y la gestiona GorillaJS y es la que sirve para llevar el histórico de despliegues, y la rama devel es la que se usa normalmente para desarrollo y desde la que GorillaJS coge las últimas versiones de los archivos.<br />
Por defecto GorillaJS no pasa los archivos de la rama devel a deploy cada vez que se ejecuta esta tarea. Para eso se tiene que usar el parámetro **-n**; esto pasará los nuevos cambios en los archivos de la rama devel a un nuevo commit de la rama deploy (generado automáticamente por GorillaJS).

Además de desplegar los archivos, GorillaJS puede ejecutar comandos de bash antes y después del despliegue. Para ejecutar comandos antes se añaden al archivo .gorilla/common/[environment]-before.sh, y para ejecutarlso después se añaden al archivo .gorilla/common/[environent]-after.sh.
Por ejemplo, se puede imprimir el mensaje "Hola" en el servidor justo antes de iniciar el despliegue de los archivos añadiendo esta línea en el archivo [environment]-before.sh
```
echo "Hola"
```

y el mensaje "Adiós" justo después del despliegue añadiendo esta línea en el archivo [environment]-after.sh
```
echo "Adiós"
```

<p align="center">
  <img src="http://s7.postimg.org/yom3jzwxn/deploy_edited.gif" alt="GorillaJS deploy example"/>
</p>

**Requerimientos**
* Tener instalado Git en la máquina local.
* Acceso sftp con clave pública al servidor remoto.

**Parámetros**
* **-e** elegir el entorno en el que desplegar los cambios [local]
* **-n** crea un nuevo punto de deploy. Es decir, comprueba los cambios que ha habido en el proyecto. [false]
* **-f** GorillaJS vuelve a hacer las preguntas para poder cambiar la configuración en ese entorno. [false]
* **-v** Enable verbose mode. [false]
* **--all** despliega todos los archivos que hay en la rama deploy. [false]

**Valores de configuración**
* **ssh/workingpath** [/var/gorilla]

    Ruta de la carpeta remota en la que GorillaJS tiene que desplegar los archivos. 

* **ssh/host** [ ]

   Nombre del servidor o ip del servidor remoto. 

* **ssh/port** [22]

    Puerto de conexión ssh del servidor remoto. 

* **ssh/username** [ ]

    Nombre de usuario ssh del servidor remoto.

* **ssh/key** [ ]

    Ruta local de la clave privada ssh.

* **ssh/passphrase** [ ] 

    Contraseña de la clave privada. Si no tiene contraseña, se tiene que dejar vacío.

* **git/branchdevel** [gorilla-devel]

    Nombre de la rama en la que están los archivos que GorillaJS va a usar en el despliegue. Normalmente es la rama de desarrollo del proyecto. Si no existe, GorillaJS la crea automáticamente.

* **git/branchdeploy** [gorilla-deploy]

    Nombre de la rama que GorillaJS va a usar para llevar el histórico de despligues. Lo ideal es que esta rama se use solamente para este cometido. Si no existe, GorillaJS la crea automáticamente.

* **project/srcin** [ ]

    Nombre de la carpeta del directorio de desarrollo que contiene los archivos que GorillaJS va a usar en el despliegue. Si la carpeta es la raíz del proyecto, se tiene que dejar vacío.

******

rollback
---
```shell
gorilla rollback -e [environment]
```

Descripción de la tarea en una línea.

Explicación más extensa del método.

Ejemplos de código, si es necesario.

<p align="center">
  <img src="http://s30.postimg.org/n3rq2r31d/rollback_edited.gif" alt="GorillaJS rollback example"/>
</p>

**Requerimientos**

**Parámetros**

**Valores de configuración**

******

docker
---
```shell
gorilla rollback -e [environment]
```

Descripción de la tarea en una línea.

Explicación más extensa del método.

Ejemplos de código, si es necesario.

<p align="center">
  <img src="http://s30.postimg.org/n3rq2r31d/rollback_edited.gif" alt="GorillaJS rollback example"/>
</p>

**Requerimientos**

**Parámetros**

**Valores de configuración**

******

clonerepo
---
```shell
gorilla rollback -e [environment]
```

Descripción de la tarea en una línea.

Explicación más extensa del método.

Ejemplos de código, si es necesario.

<p align="center">
  <img src="http://s30.postimg.org/n3rq2r31d/rollback_edited.gif" alt="GorillaJS rollback example"/>
</p>

**Requerimientos**

**Parámetros**

**Valores de configuración**

******

createrepo
---
```shell
gorilla createrepo -e [environment]
```

Descripción de la tarea en una línea.

Explicación más extensa del método.

Ejemplos de código, si es necesario.

<p align="center">
  <img src="http://s30.postimg.org/n3rq2r31d/rollback_edited.gif" alt="GorillaJS rollback example"/>
</p>

**Requerimientos**

**Parámetros**

**Valores de configuración**
