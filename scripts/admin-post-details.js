$(document).ready(function() {
    $('.admin-post-row-title').on('click', function(e) {
        e.preventDefault();

        $(this).parent().siblings('.post-content-container').slideToggle();
    })
});