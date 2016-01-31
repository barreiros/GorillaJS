# GorillaJS
**GorillaJS es una herramienta que ayuda a automatizar de manera sencilla tareas complejas del desarrollo web.**

## Objetivo y filosofía

## Con GorillaJS se puede:
* **Crear y configurar Docker container's en servidores remotos desde tu máquina local.**
* **Desplegar versiones en servidores remotos (deploy).**
* **Revertir los cambios en cualquier momento (rollback).**
* **Gestionar el histórico de versiones con git.**
* **Crear repositorios públicos y privados en Gitlab, Github y Bitbucket.**
* **Clonar repositorios remotos sin heredar el histórico.**

## Instalación

## Uso de GorillaJS
Descripción general de cómo usar GorillaJS. No tengo que entrar en demasiados detalles. La información ampliada la tienen cada uno de los métodos.
Aquí irá un ejemplo básico. Puedo poner el vídeo.

## Listado de enlaces hacia la página de cada un de los métodos/task (tengo que pensar cómo llamar a las funciones de entrada. 
* deploy
* rollback
* docker
* git[clone|remote]
* provision

### Deploy
GorillaJS solo desplegará los archivos que se hayan commiteado; con el resto se hará un stash al inicio y un stash pop al final del proceso.
Por defecto el deploy se hace sobre el último que haya hecho el usuario.

**Requerimientos**
* Tener instalado Git en la máquina local.
* Acceso sftp con clave pública al servidor remoto.

**Parámetros**
* **-e** eliges el entorno en el que deplegar tus cambios [local]
* **-n** crea un nuevo deploy [false]
* **--all** despliega todos los archivos que hay en la rama deploy [false]

**Valores**
* 
