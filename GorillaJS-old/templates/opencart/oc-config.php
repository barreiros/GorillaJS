<?php
// HTTP
define('HTTP_SERVER', 'http://opencart.local/');

// HTTPS
define('HTTPS_SERVER', 'http://opencart.local/');

define('DIR_APPLICATION', '/var/www/opencart.local/application/catalog/');
define('DIR_SYSTEM', '/var/www/opencart.local/application/system/');
define('DIR_IMAGE', '/var/www/opencart.local/application/image/');
define('DIR_LANGUAGE', DIR_APPLICATION . 'language/');
define('DIR_TEMPLATE', DIR_APPLICATION . 'view/theme/');
define('DIR_CONFIG', DIR_SYSTEM . 'config/');
define('DIR_CACHE', DIR_SYSTEM . 'storage/cache/');
define('DIR_DOWNLOAD', DIR_SYSTEM . 'storage/download/');
define('DIR_LOGS', DIR_SYSTEM . 'storage/logs/');
define('DIR_MODIFICATION', DIR_SYSTEM . 'storage/modification/');
define('DIR_UPLOAD', DIR_SYSTEM . 'storage/upload/');

// DB
define('DB_DRIVER', 'mysqli');
define('DB_HOSTNAME', 'mysql');
define('DB_USERNAME', 'gorilla');
define('DB_PASSWORD', '1234');
define('DB_DATABASE', 'gorilladb');
define('DB_PORT', '3306');
define('DB_PREFIX', 'oc_');
