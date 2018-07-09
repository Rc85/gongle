$(document).ready(function() {
    $('.compose-message').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        showLoading();

        $.post({
            url: '/send-message',
            data: $(form).serialize(),
            success: function(resp) {
                hideLoading();

                $(form).find('input[type=text], textarea').val('');
                
                if (resp.status === 'success') {
                    alertify.success('Message sent');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            }
        });
    });

    $('#reply-button').on('click', function() {
        $('.reply-form').slideToggle();
    });

    $('.star-message').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        showLoading();

        $.post({
            url: '/star-message',
            data: $(form).serialize(),
            success: function(resp) {
                hideLoading();

                if (resp.status === 'success') {
                    $(form).find('button').html('');
                    $(form).find('button').append(
                        $('<span>').addClass('fa-stack fa-lg').append(
                            $('<i>').addClass('fas fa-star fa-stack-1x followed'),
                            $('<i>').addClass('far fa-star fa-stack-1x')
                        )
                    )
                    alertify.success('Message starred');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            }
        });
    });

    $('#accept-friend').on('click', function(e) {
        e.preventDefault();
        let url = $(this).attr('href');

        showLoading();

        $.get({
            url: url,
            success: function(resp) {
                hideLoading();

                if (resp.status === 'success') {
                    alertify.success('Friend accepted');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                } else if (resp.status === 'are friends') {
                    alertify.error('You two are already friends');
                } else if (resp.status === 'add error') {
                    alertify.error('An error occurred when trying to add the user');
                } else if (resp.status === 'accept error') {
                    alertify.error('A error occurred when accepting the request');
                } else if (resp.status === 'invalid') {
                    alertify.error('Invalid user');
                }
            }
        });
    });
});