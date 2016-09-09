var fadeTime = 1000;


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
    $("#d1t1").fadeIn(fadeTime);
    $("#d1t2").fadeIn(fadeTime);
    $(document).scroll( function() {
        if (isScrolledIntoView($("#headerTransition")) === true && ($('.navbar-toggle').attr('aria-expanded') === "false"))
            document.getElementById('nav_header').style.background = 'transparent';
        else{ 
            document.getElementById('nav_header').style.background = '#86E2D5';
            document.getElementById('nav_header').style.opacity = .9;
        }
        if (isScrolledIntoView($("#d2t1")) === true) {
            $("#d2t1").fadeIn(fadeTime);
        }
        if (isScrolledIntoView($("#d2t2")) === true) {
            $("#d2t2").fadeIn(fadeTime);
        }
        if (isScrolledIntoView($("#d3t1")) === true) {
            $("#d3t1").slideDown(fadeTime);
        }
        if (isScrolledIntoView($("#d3t2")) === true) {
            $("#d3t2").fadeIn(fadeTime);
        }
    });
});


function isScrolledIntoView(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    if (elem.is(":visible")) {
        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();
    } else {
        var elemTop = $(elem).show().offset().top;
        var elemBottom = elemTop + $(elem).height();
        $(elem).hide();
    }

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
