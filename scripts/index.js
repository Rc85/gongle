$(document).ready(function() {
    $('.category-bar').on('click', function() {
        let categoryTitle = $(this);
        $(categoryTitle).siblings('.category-list-parent').slideToggle();

        if ($(categoryTitle).children('i').hasClass('fa-angle-down')) {
            $(categoryTitle).children('i').removeClass('fa-angle-down').addClass('fa-angle-up');
        } else {
            $(categoryTitle).children('i').removeClass('fa-angle-up').addClass('fa-angle-down');
        }
    });

    $('.category-title').on('click', function(e) {
        e.stopPropagation();
    });
});