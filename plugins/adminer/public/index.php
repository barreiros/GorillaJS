<script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4=" crossorigin="anonymous"></script>

<script>

    'use strict'

    var $j = jQuery.noConflict(true);
    var driverMatch = {
        'mysql': 'server',
        'sqlite': 'sqlite',
        'postgresql': 'pgsql',
        'mongodb': 'mongo',
        'oracle': 'oracle',
        'elacticsearch': 'elastic'
    };

    var init = function(){

        $j('select[name*=driver] option').attr('disabled', 'disabled');
        $j('input[name*=server]').attr('readonly', 'readonly');
        $j('select[name*=driver] option').removeAttr('selected');

        $j.getJSON('list.json', function(data){

            if(data.hasOwnProperty(window.location.hostname)){

                data = data[window.location.hostname];

                // Configuro el campo host para que por defecto aparezca la primera opción del json y que cuando cambie lo vuelva a rellenar con la opción correcta.
                $j('select[name*=drive]').on('change', function(){

                    for(var key in driverMatch){

                        if(driverMatch[key] === $j(this).val()){

                            $j('input[name*=server]').val(key);

                        }

                    }

                });

                // Oculto las opciones que no estén en el json.
                for(var key in data){

                    $j('select[name*=driver] option[value="' + driverMatch[data[key]] + '"').removeAttr('disabled');

                }

                $j('select[name*=driver] option[value="' + driverMatch[data[0]] + '"').attr('selected', 'selected');
                $j('input[name*=server]').val(data[0]);

            }

        });

    }

    $j(document).ready(init);

</script>

<?php

    include_once('adminer.php');

?>

