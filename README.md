GorillaJS
===
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
```
npm install -g gorillajs
```

### Listado de tareas
* [deploy](#user-content-deploy)
* rollback
* docker
* git[clone|remote]
* provision


***


Deploy
---
GorillaJS solo desplegará los archivos que se hayan commiteado; con el resto se hará un stash al inicio y un stash pop al final del proceso.
Por defecto el deploy se hace sobre el último que haya hecho el usuario.

**Requerimientos**
* Tener instalado Git en la máquina local.
* Acceso sftp con clave pública al servidor remoto.

**Parámetros**
* **-e** elegir el entorno en el que desplegar los cambios [local]
* **-n** crea un nuevo punto de deploy. Es decir, comprueba los cambios que ha habido en el proyecto. [false]
* **--all** despliega todos los archivos que hay en la rama deploy [false]
* **-f** GorillaJS vuelve a hacer las preguntas para poder cambiar la configuración en ese entorno. [false]

**Valores de configuración**
* 
