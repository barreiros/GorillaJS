<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'gorilladb' );

/** MySQL database username */
define( 'DB_USER', 'gorilla' );

/** MySQL database password */
define( 'DB_PASSWORD', 'gorilla_598565' );

/** MySQL hostname */
define( 'DB_HOST', 'caritas.web.test_mysql' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '}cs`2;-segIzep&dNE(&o`s,|SuyJ5T.:gUKi2T]q >5l,gG6pFejE=nU/x[O?}K' );
define( 'SECURE_AUTH_KEY',  'hCI~K;jkI4$zcG)`>N#|8AFs)y.{{l&=+1!5s{KN|8w|_x}jPOzHoC-3CqK=jx9_' );
define( 'LOGGED_IN_KEY',    '*_%^UCG*}:Fypey(5+1|~Zx6SxSv,d-KkPi{E@7%XbzAT}7,zV#,5Nk);?d[xHob' );
define( 'NONCE_KEY',        'Q?%W$goZR$*0Ph 5<[ChC:SMDwn;ts^L_b0JSul;5/FzYfOYg5g5ge4PAz+#/NP/' );
define( 'AUTH_SALT',        'g8uf!:(<hg}fn2OWILpLLKfH>I+m5[A_~dT.t=sphB:2.w12x30f9^r5i6K|0}lI' );
define( 'SECURE_AUTH_SALT', '[h8kt&Io8wk>pCr{j mk$=[X[%E2tuRbLY;Tu@/=H)_g]R[T|/.R:Mq3H4B@O~}N' );
define( 'LOGGED_IN_SALT',   'rKho7<?<T|}!_y9gPQMJX/jb~ejDFG[J.#7[XB6wOu<!I|6%(ZSTXJrG@[R9>{$8' );
define( 'NONCE_SALT',       'bYjgS@$pSD^/J|[Lzqf*,;s5##z%QJn6 CU9r@<s@p<-j8Qb`R~Ps5#O@RL5&4L$' );

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = '21279_';




/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) )
	define( 'ABSPATH', dirname( __FILE__ ) . '/' );

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
