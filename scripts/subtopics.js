$(document).ready(function() {
    $('#new-post-button').on('click', function() {
        $('#post-form').slideToggle();
    });

    console.log('hi');

    $.get({
        url: location.href,
        success: function(resp) {
            console.log(resp);
        }
    })
});