# GorillaJS
**GorillaJS es una herramienta que ayuda a automatizar de manera sencilla tareas complejas del desarrollo web.**

## Con GorillaJS se puede:
* **Crear y configurar Docker container's en servidores remotos desde tu máquina local.**
* **Desplegar versiones en servidores remotos (deploy).**
* **Revertir los cambios en cualquier momento (rollback).**
* **Gestionar el histórico de versiones con git.**
* **Crear repositorios públicos y privados en Gitlab, Github y Bitbucket.**
* **Clonar repositorios remotos sin heredar el histórico.**




### Deploy
GorillaJS solo desplegará los archivos que se hayan commiteado; con el resto se hará un stash al inicio y un stash pop al final del proceso.
Por defecto el deploy se hace sobre el último que haya hecho el usuario.

**Parámetros**
* **-e** eliges el entorno en el que deplegar tus cambios [local]
* **-n** crea un nuevo deploy [false]
* **--all** despliega todos los archivos que hay en la rama deploy [false]

**Valores**
* 
