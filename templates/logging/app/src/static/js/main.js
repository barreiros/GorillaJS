var Main = function(){
    
    var socket = io.connect('http://localhost:3001');

    socket.on('connect', function(data) {

    });

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

        $('#output').append(line);

    });

    $('#projects').dropdown({

        onChange: function(value, text, $choice){

            socket.emit('change_project', value);

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

