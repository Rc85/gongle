$(document).ready(function() {
    $('.categories-header').on('click', function() {
        $(this).siblings('.topics-list').slideToggle();

        if ($(this).children('i').hasClass('fa-angle-down')) {
            $(this).children('i').addClass('fa-angle-up').removeClass('fa-angle-down');
        } else {
            $(this).children('i').addClass('fa-angle-down').removeClass('fa-angle-up');
        }
    });

    $('.topics-header').on('click', function() {
        $(this).siblings('.subtopics-list').slideToggle();

        if ($(this).children('i').hasClass('fa-angle-down')) {
            $(this).children('i').addClass('fa-angle-up').removeClass('fa-angle-down');
        } else {
            $(this).children('i').addClass('fa-angle-down').removeClass('fa-angle-up');
        }
    })
    //toggleContent('.categories-header', '.topics-list')
    //toggleContent('.topics-header', '.subtopics-list')
});