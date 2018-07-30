$(document).ready(function() {
    $('.category-bar').on('click', function() {
        $(this).siblings('section').slideToggle();

        if ($(this).children('i').hasClass('fa-angle-up')) {
            $(this).children('i').removeClass('fa-angle-up').addClass('fa-angle-down');
        } else {
            $(this).children('i').removeClass('fa-angle-down').addClass('fa-angle-up');
        }
    });

    $('.category-title').on('click', function(e) {
        e.stopPropagation();
    });
});