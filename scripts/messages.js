$(document).ready(function() {
    $('.compose-message, .reply-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        Message.send(form, (resp) => {
            App.handle.response(resp, () => {
                alertify.success('Message sent');

                $(form).find('input[type=text], textarea').not('input[name=alt_subject]').val('');
            });
        });
    });

    $('#reply-button').on('click', function() {
        $('.reply-form').slideToggle();
    });

    $('.save-message').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        Message.save(form, () => {
            $(form).find('button').html('');
            $(form).find('button').append(
                $('<span>').addClass('fa-stack fa-lg').append(
                    $('<i>').addClass('fas fa-star fa-stack-1x followed'),
                    $('<i>').addClass('far fa-star fa-stack-1x')
                )
            )
        });
    });

    $('#accept-friend').on('click', function(e) {
        e.preventDefault();
        let url = $(this).attr('href');

        User.friend.accept(url, (resp) => {
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

            Message.delete(form, (resp) => {
                App.handle.response(resp, (resp) => {
                    if (resp.from === 'messages') {
                        $(form).parent().parent().remove();
                    } else {
                        location.href = '/messages/inbox?key=' + resp.key;
                    }
                });
            });
        }, () => {
            App.loading.hide();
            return false;
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

            Message.delete(messages, true, (resp) => {
                App.handle.response(resp, () => {
                    location.reload();
                });
            });
        }, () => {
            App.loading.hide();
            return false;
        });
    });

    $('.select-message').on('click', function() {
        let checkbox = $(this);

        if ($(checkbox).prop('checked')) {
            messages.push(parseInt($(checkbox).attr('value')));
        } else {
            messages.splice(messages.indexOf($(checkbox).attr('value')), 1);
        }
    });

    $('#report-message').on('click', function(e) {
        e.preventDefault();
        let form = $(this);

        Message.report(form, (resp) => {
            App.handle.response(resp, () => {
                alertify.success('Message reported');
            });
        });
    });

    $('.unsave-message').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);
        
        Message.unsave(form, (resp) => {
            App.handle.response(resp, () => {
                $(form).find('button').html('<i class="far fa-lg fa-star"></i>');
                alertify.success('Message unsaved');
            });
        });
    });
});