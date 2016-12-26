var Main = function(){
    
    var socket = io.connect(window.location.hostname + ':3001');

    socket.on('projects_list', function(projects){

        if(projects.length){

            $('#projects .menu .item').remove();
            for(var key in projects){

                $('#projects .menu').append('<div class="item">' + projects[key] + '</div>');

            }

        }

    });

    socket.on('new_project', function(containers){

        if(containers.length){

            $('#containers .menu .item').remove();
            for(var key in containers){

                $('#containers .menu').append('<div class="item">' + containers[key] + '</div>');

            }

        }

    });

    socket.on('new_line', function(line){

        if(line.indexOf('\n') === -1){

            $('#output').append(line.replace(/[\r\n]/g, '<br />'));
            $('#output').append('<br />');

        }else{

            $('#output').append(line.replace(/[\r\n]/g, '<br />'));

        }

        if($('#autoscroll').checkbox('is checked')){

            $('html, body').animate({ 
                scrollTop: $(document).height() 
            }, 200);

        }

    });

    $('#projects').dropdown({

        onChange: function(value, text, $choice){

            socket.emit('change_project', value);

        }

    });

    $('#autoscroll').checkbox('check');
    $('#autoscroll').checkbox({

        onChange: function(){

        }

    });

    $('#containers').dropdown({

        onChange: function(value, text, $choice){

            $('#output').empty();
            socket.emit('change_container', value);

        }

    });


};

$(window).on('ready', function(){

    new Main();

});

