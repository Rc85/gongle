$(document).ready(function() {
    $('.compose-message, .reply-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        App.loading.show();

        $.post({
            url: '/send-message',
            data: $(form).serialize(),
            success: function(resp) {
                App.loading.hide();

                if (resp.status === 'success') {
                    $(form).find('input[type=text], textarea').not('input[name=alt_subject]').val('');
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

        App.loading.show();

        $.post({
            url: '/star-message',
            data: $(form).serialize(),
            success: function(resp) {
                App.loading.hide();

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

        App.loading.show();

        $.get({
            url: url,
            success: function(resp) {
                App.loading.hide();

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
                } else if (resp.status === 'not found') {
                    alertify.error('Friend request not found');
                }
            }
        });
    });

    let recipient = App.url.param('u')

    if (recipient) {
        $('#recipient-input').val(recipient);
    }

    $('.delete-message').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        alertify
        .okBtn('Yes')
        .cancelBtn('No')
        .confirm('Are you sure you want to delete this message?' , function(e) {
            e.preventDefault();

            App.loading.show();

            $.post({
                url: '/delete-message',
                data: $(form).serialize(),
                success: function(resp) {
                    App.loading.hide();
                    console.log(resp);

                    if (resp.status === 'success') {
                        if (resp.from === 'messages') {
                            $(form).parent().parent().remove();
                        } else {
                            location.href = '/messages/inbox?key=' + resp.key;
                        }

                        alertify.success('Message deleted')
                    } else if (resp.status === 'failed') {
                        alertify.error('Unable to delete message');
                    } else if (resp.status === 'error') {
                        alertify.error('An error occurred');
                    } else if (resp.status === 'unauthorized') {
                        alertify.error('You\'re not authorized');
                    }
                }
            });
        });
    });

    let messages = [];

    $('#check-all').on('click', function() {
        if ($('#check-all').prop('checked')) {
            $('.select-message').prop('checked', true);
            $('.select-message').each(function(i, message) {
                messages.push($(message).attr('value'));
            });
        } else {
            $('.select-message').prop('checked', false);
        }
    });

    $('.delete-all-messages').on('submit', function(e) {
        e.preventDefault();

        alertify
        .okBtn('Yes')
        .cancelBtn('No')
        .confirm('Are you sure you want to delete the selected messages?', function(e) {
            e.preventDefault();

            if (messages.length > 0) {
                $.post({
                    url: '/delete-all',
                    data: {
                        type: 'messages',
                        ids: messages
                    },
                    success: function(resp) {
                        console.log(resp);
                        App.loading.hide();

                        if (resp.status === 'success') {
                            location.reload();
                        } else if (resp.status === 'error') {
                            alertify.error('An error occurred');
                        } else if (resp.status === 'nothing') {
                            alertify('Nothing to delete');
                        }
                    }
                });
            } else {
                alertify.error('Select messages to delete');
            }
        });
    });

    $('.select-message').on('click', function() {
        let checkbox = $(this);

        if ($(checkbox).prop('checked')) {
            messages.push(parseInt($(checkbox).attr('value')));
        } else {
            messages.splice(messages.indexOf($(checkbox).attr('value')), 1);
        }

        console.log(messages);
    });
});