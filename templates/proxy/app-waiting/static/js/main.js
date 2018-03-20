var Main = function(){

    var bar = new ProgressBar.Line('#progress-bar', {
        strokeWidth: 4,
        easing: 'easeOut',
        duration: 100000,
        color: '#DA7A20',
        trailColor: '#eee',
        trailWidth: 1,
        svgStyle: {width: '100%', height: '100%'},
        text: {
            style: {
                // Text color.
                // Default: same as stroke color (options.color)
                color: '#999',
                position: 'absolute',
                left: '90px',
                top: '10px',
                padding: 0,
                margin: 0,
                transform: null
            },
            autoStyleContainer: false
        },
        from: {color: '#FFEA82'},
        to: {color: '#ED6A5A'},
        step: (state, bar) => {
            bar.setText(Math.round(bar.value() * 100) + ' %');
        }
    });

    bar.animate(0.98);  // Number from 0.0 to 1.0

}();
