$(document).ready(function() {
    alertify.parent(document.body);

    $('.vote-post').on('click', function() {
        let id = $(this).attr('data-id');
        let vote = $(this).attr('value');

        Post.vote(id, vote, (resp) => {
            App.handle.response(resp, (resp) => {
                if (resp.vote === 'up') {
                    $('.vote-' + id).find('button[value=up]').prop('disabled', true).html('<i class="fas fa-lg fa-thumbs-up">');
                    $('.vote-' + id).find('button[value=down]').prop('disabled', false).children().removeClass('fas').addClass('far');
                    $('.vote-' + id).find('span.vote-counter').text(resp.vote_count);
                } else {
                    $('.vote-' + id).find('button[value=down]').prop('disabled', true).html('<i class="fas fa-lg fa-thumbs-down">');
                    $('.vote-' + id).find('button[value=up]').prop('disabled', false).children().removeClass('fas').addClass('far');
                    $('.vote-' + id).find('span.vote-counter').text(resp.vote_count);
                }
            });
        });
    });

    $('.tooltip-button').on('mouseover', function() {
        $(this).siblings('.tooltip').show();
    });

    $('.tooltip-button').on('mouseout', function() {
        $(this).siblings('.tooltip').hide();
    });

    Toggle.menu('user-menu-button', 'mod-user-menu');

    $('.issue-violation').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        alertify
        .prompt('Reason for violation:', function(val, e) {
            e.preventDefault();
            let data = $(form).serialize() + '&reason=' + val;

            App.loading.show();

            $.post({
                url: '/issue-violation',
                data: data,
                success: function(resp) {
                    console.log(resp);
                    App.loading.hide();
                    if (resp.status === 'success') {
                        alertify.success('Violation sent');
                    } else if (resp.status === 'forbidden') {
                        alertify.alert('Cannot issue violation to moderators or administrators.');
                    } else if (resp.status === 'error') {
                        alertify.error('An error occurred');
                    }
                }
            });
        }, function() {
            return false;
        });
    });

    $('.temp-ban, .perm-ban, .activate-user').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);
        let status = $(form).children('input[name=status]').val();
        let msg;

        if (status === 'Active') {
            msg = 'User activated';
        } else if (status === 'Suspended') {
            msg = 'User temporary banned';
        } else if (status === 'Banned') {
            msg = 'User permanently banned';
        }

        User.status(form, (resp) => {
            App.handle.response(resp, () => {
                alertify.success(msg);
            });
        });
    });

    $('.user-report a').on('click', function(e) {
        e.preventDefault();

        $(this).parent().submit();
    });

    $('.user-report').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        alertify.confirm('Are you sure you want to send a report?', function(e) {
            e.preventDefault();
            
            Post.report(form, (resp) => {
                App.handle.response(resp, () => {
                    alertify.success('Report sent');
                });
            });
        }, function() {
            return false;
        });
    });

    $('.open-post, .close-post, .remove-post').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);
        let successMessage;

        if ($(this).children('input[name=status]').val() === 'Open') {
            successMessage = 'Post opened';
        } else if ($(this).children('input[name=status]').val() === 'Closed') {
            successMessage = 'Post closed';
        } else if ($(this).children('input[name=status]').val() === 'Removed') {
            successMessage = 'Post removed';
        }

        Post.status(form, (resp) => {
            App.handle.response(resp, () => {
                alertify.success(successMessage);
            });
        });
    });

    $('.open-post a, .close-post a, .remove-post a').on('click', function(e) {
        e.preventDefault();

        $(this).parent().submit();
    });

    $('.add-friend').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        User.friend.add(form, (resp) => {
            App.handle.response(resp, () => {
                alertify.success('Request sent');
            });
        });
    });

    $('#follow-post-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        Post.follow(form, (resp) => {
            if (resp.status === 'followed') {
                alertify.error('Already following');
            } else if (resp.status === 'error') {
                alertify.error('An error occurred');
            } else if (resp.status === 'success') {
                $(form).children('button[type=submit]').empty().append(
                    $('<span>').addClass('fa-stack fa-lg').append(
                        $('<i>').addClass('fas fa-star fa-stack-1x followed'),
                        $('<i>').addClass('far fa-star fa-stack-1x')
                    ),
                    'Followed'
                );
            } else if (resp.status === 'unfollowed') {
                $(form).children('button[type=submit]').empty().append(
                    $('<i>').addClass('far fa-lg fa-star'),
                    ' Follow'
                )
            }
        });
    });

    $('.post-type-button input').on('click', function() {
        $('.post-type-button').removeClass('active');
        $(this).parent().addClass('active');
    });

    $('.notification-button').on('click', function(e) {
        $('.notification-container').prepend(
            $('<div>').addClass('notification-loading text-center').append(
                $('<i>').addClass('fas fa-spinner fa-3x fa-spin')
            )
        );

        $.post({
            url: '/get-notifications',
            success: (resp) => {
                console.log(resp);
                App.handle.response(resp, resp => {
                    if (resp.notifications.length === 0) {
                        $('.notification-container').find('.notification-loading').remove();
                        $('.notification-container').find('.notification').remove();
                    } else {
                        $('.notification-container').find('.notification-loading').remove();
                        
                        for (let n of resp.notifications) {
                            $('.notification-container').prepend(
                                $('<div>').addClass('notification').append(
                                    $('<span>').html(n.notification_title),
                                    $('<div>').addClass('mt-15 text-right').html(n.notification_date)
                                )
                            )
                        }

                        $.post({
                            url: '/change-notification-status',
                            success: (resp) => {
                                if (resp.status === 'success') {
                                    $('.notification-icon').children('.notification-counter').remove();
                                }
                            }
                        });
                    }
                });
            }
        });
    });

    Toggle.menu('notification-button', 'notification-container');
});