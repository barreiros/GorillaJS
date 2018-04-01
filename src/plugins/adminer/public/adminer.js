'use strict'

var $j = jQuery.noConflict(true);
var driverMatch = {
    'mysql': 'server',
    'mariadb': 'server',
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

        var keyFormatted, exit;

        if(data.hasOwnProperty(window.location.hostname)){

            data = data[window.location.hostname];
            exit = false;

            // Configuro el campo host para que por defecto aparezca la primera opci.n del json y que cuando cambie lo vuelva a rellenar con la opci.n correcta.
            $j('select[name*=drive]').on('change', function(){

                for(var key in driverMatch){

                    if(exit){

                        break;

                    }

                    if(driverMatch[key] === $j(this).val()){

                        for(var host in data){

                            if(data[host] === key){

                                $j('input[name*=server]').val(host);
                                exit = true;

                                break;

                            }

                        }

                    }

                }

            });

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

            $j('select[name*=driver] option[value="' + driverMatch[data[Object.keys(data)[0]]] + '"').attr('selected', 'selected');
            $j('input[name*=server]').val(Object.keys(data)[0]);

        }

    });

}

$j(document).ready(init);
