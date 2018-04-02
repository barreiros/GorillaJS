<?php

    function adminer_object() {
      
        class AdminerSoftware extends Adminer {
        
            function loginForm(){

                global $drivers;

                // Creo un array con las correspondencias entre motores de búsqueda.
                $driverMatch = [
                    'mysql' => 'server',
                    'mariadb' => 'server',
                    'sqlite' => 'sqlite',
                    'postgresql' => 'pgsql',
                    'mongodb' => 'mongo',
                    'oracle' => 'oracle',
                    'elacticsearch' => 'elastic'
                ];

                // Cargo el listado con los proyectos y sus motores.
                $json = file_get_contents('./list.json');
                $list = json_decode($json, true);
                

                // Creo un input type select, si son más de uno, o un input.

                ?>

                    <table cellspacing="0">

                        <input id="driver" type="hidden" name="auth[driver]" />

                        <tr><th>

                            <?php
                
                                echo lang('Docker container');
                                echo '<td>';

                                if(isset($list[$_SERVER['SERVER_NAME']])){

                                    echo '<select id="server" name="auth[server]">';

                                    foreach($list[$_SERVER['SERVER_NAME']] as $key => $engine){

                                        echo '<option data-engine="' . $driverMatch[$engine] . '" value="' . $key . '">' . $engine . '</option>';

                                    }

                                    echo '</select>';

                                }

                            ?>

                        <tr><th><?php echo lang('Username'); ?><td><input name="auth[username]" id="username" value="<?php echo h($_GET["username"]); ?>" autocapitalize="off">
                        <tr><th><?php echo lang('Password'); ?><td><input type="password" name="auth[password]">
                        <tr><th><?php echo lang('Database'); ?><td><input name="auth[db]" value="<?php echo h($_GET["db"]); ?>" autocapitalize="off">

                    </table>

                <?php

                $my_script = "var server = document.getElementById('server');";
                $my_script .= "var driver = document.getElementById('driver');";
                $my_script .= "server.addEventListener('change', function(e){";
                $my_script .= "         console.log('Hola, Bar', e.target.selectedIndex, e.target.options[e.target.selectedIndex].dataset.engine);";
                $my_script .= "         var engine = e.target.options[e.target.selectedIndex].dataset.engine;";
                $my_script .= "         driver.setAttribute('value', engine);";
                $my_script .= "});";
                $my_script .= "driver.setAttribute('value', server.options[0].dataset.engine);";

                echo script($my_script);
                echo script("focus(qs('#username'));"); 
                echo "<p><input type='submit' value='" . lang('Login') . "'>\n";
                echo checkbox("auth[permanent]", 1, $_COOKIE["adminer_permanent"], lang('Permanent login')) . "\n";

            }
        
        }
      
        return new AdminerSoftware;

    }

    include './adminer.php';
