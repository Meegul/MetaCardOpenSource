$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
});

$(document).ready(function() {
    $('.navbar-toggle').click(function() {
        $(this).toggleClass("active");
        if ($('.navbar-toggle').attr('aria-expanded') === "false") {
            $('#nav_header').css({
                'background-color': '#86E2D5',
            });
            $('#patty').css({
                'background-color': 'transparent',
            });
        }
        else{
            $('#nav_header').css({
            'background-color': 'transparent',
            });
            $('#patty').css({
                'background-color': "",
            });
        }
    });
});