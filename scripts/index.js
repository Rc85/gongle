$(document).ready(function() {
    toggleContent('.category-bar', '.category-list-parent')

    $('.category-title').on('click', function(e) {
        e.stopPropagation();
    });
});