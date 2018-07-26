$(document).ready(function() {
    $('.categories-header').on('click', function() {
        $(this).siblings('.topics-list').slideToggle();
    });

    $('.topics-header').on('click', function() {
        $(this).siblings('.subtopics-list').slideToggle();
    })
    //toggleContent('.categories-header', '.topics-list')
    //toggleContent('.topics-header', '.subtopics-list')
});