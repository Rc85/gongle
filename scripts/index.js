$(document).ready(function() {
    $('.category-bar').on('click', function() {
        $(this).siblings('.category-list-parent').slideToggle();
    });

    $('.category-title').on('click', function(e) {
        e.stopPropagation();
    });
});