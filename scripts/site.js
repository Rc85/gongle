$(document).ready(function() {
    alertify.parent(document.body);

    $('.vote-post').on('click', function() {
        let clicked = $(this);
        let id = $(clicked).attr('data-id');
        let vote = $(clicked).attr('value');

        $.post({
            url: '/vote-post',
            data: {
                id: id,
                vote: vote  
            },
            success: function(resp) {
                console.log(resp);
                if (resp.status === 'success') {
                    if (resp.vote === 'up') {
                        $('.vote-' + id).find('button[value=up]').prop('disabled', true).html('<i class="fas fa-lg fa-thumbs-up">');
                        $('.vote-' + id).find('button[value=down]').prop('disabled', false).children().removeClass('fas').addClass('far');
                        $('.vote-' + id).find('span.vote-counter').text(resp.vote_count);
                    } else {
                        $('.vote-' + id).find('button[value=down]').prop('disabled', true).html('<i class="fas fa-lg fa-thumbs-down">');
                        $('.vote-' + id).find('button[value=up]').prop('disabled', false).children().removeClass('fas').addClass('far');
                        $('.vote-' + id).find('span.vote-counter').text(resp.vote_count);
                    }
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            }
        });
    });

    $('.tooltip-button').on('mouseover', function() {
        $(this).siblings('.tooltip').show();
    });

    $('.tooltip-button').on('mouseout', function() {
        $(this).siblings('.tooltip').hide();
    });

    //Toggle.menu('user-menu-button', 'mod-user-menu');

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

    $('.temp-ban, .perm-ban').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        changeUserStatus(form, $(form).children('input[name=option]').val(), '.post-username-column');
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
            App.loading.show();

            $.post({
                url: '/user-report',
                data: $(form).serialize(),
                success: function(resp) {
                    App.loading.hide();

                    if (resp.status === 'success') {
                        alertify.success('Report sent');
                    } else if (resp.status === 'error') {
                        alertify.error('An error occurred');
                    } else if (resp.status === 'fail') {
                        alertify.error('Failed');
                    } else if (resp.status === 'duplicate') {
                        alertify.error('Report already sent');
                    }
                }
            })
        }, function() {
            return false;
        });
    });

    $('.open-post, .close-post, .remove-post').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        if ($(this).children('input[name=status]').val() === 'Open') {
            var successMessage = 'Post opened';
        } else if ($(this).children('input[name=status]').val() === 'Closed') {
            var successMessage = 'Post closed';
        } else if ($(this).children('input[name=status]').val() === 'Removed') {
            var successMessage = 'Post removed';
        }

        App.loading.show();

        $.post({
            url: '/change-status',
            data: $(this).serialize(),
            success: function(resp) {
                App.loading.hide();

                if (resp.status === 'success') {
                    let postStatus = $(form).parents('.admin-post-row').find('.post-status');
                    if (resp.post_status === 'Open') {
                        $(postStatus).removeClass('error-badge critical-badge').addClass('success-badge').text('Open');
                    } else if (resp.post_status === 'Closed') {
                        $(postStatus).removeClass('success-badge critical-badge').addClass('error-badge').text('Closed');
                    } else if (resp.post_status === 'Removed') {
                        $(postStatus).removeClass('success-badge error-badge').addClass('critical-badge').text('Removed');
                    }
                
                    alertify.success(successMessage);
                } else if (resp.status === 'not found') {
                    alertify.error('Post not found');
                } else if (resp.status === 'unauthorized') {
                    alertify.error('You\'re not authorized');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            }
        });
    });

    $('.open-post a, .close-post a, .remove-post a').on('click', function(e) {
        e.preventDefault();

        $(this).parent().submit();
    });

    $('.add-friend').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        $.post({
            url: '/add-friend',
            data: $(form).serialize(),
            success: function(resp) {
                if (resp.status === 'success') {
                    alertify.success('Friend request sent');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                } else if (resp.status === 'requested') {
                    alertify.error('Request already sent');
                }
            }
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

    //let userMenuOpened = false;
    
    /* $('body').on('click', function(e) {
        if (userMenuOpened === e.target) {
            $('body').find('.mod-user-menu').remove();
            userMenuOpened = false;
        } else {
            $('body').find('.mod-user-menu').remove();
            userMenuOpened === e.target;
        }
    }); */

    /* $('body').on('click', function(e) {
        if (e.target.className === 'user-menu-button') {
            let container = $(e.target).parent();
            let username = $(e.target).attr('data-username');
            
            if (userMenuOpened !== e.target) {
                userMenuOpened = e.target;
                $('body').find('.mod-user-menu').remove();

                $.post({
                    url: '/user-menu',
                    data: {
                        username: username
                    },
                    success: function(resp) {
                        console.log(resp);
                        if (resp.status === 'success') {
                            let menuOptions = $('<div>').append(
                                resp.user.fid === null ?
                                $('<form>').addClass('add-friend').attr({'action': '/add-friend', 'method': 'POST'}).append(
                                    $('<input>').attr({'type': 'hidden', 'name': 'username', 'value': resp.user.username}),
                                    $('<button>').attr('type', 'submit').append(
                                        $('<i>').addClass('fas fa-lg fa-user-plus')

                                    )
                                ).on('submit', function(e) {
                                    e.preventDefault();
                                    let form = $(this);
                            
                                    $.post({
                                        url: '/add-friend',
                                        data: $(form).serialize(),
                                        success: function(resp) {
                                            if (resp.status === 'success') {
                                                alertify.success('Friend request sent');
                                            } else if (resp.status === 'error') {
                                                alertify.error('An error occurred');
                                            } else if (resp.status === 'requested') {
                                                alertify.error('Request already sent');
                                            }
                                        }
                                    });
                                }) :
                                $('<span>').addClass('user-badge success-badge').text('Friend')
                            )

                            let menu = $('<div>').addClass('mod-user-menu').append(
                                $('<div>').addClass('d-flex').append(
                                    $('<div>').addClass('mr-5').append(
                                        $('<a>').attr('href', '/profile?u=' + resp.user.username).append(
                                            $('<img>').addClass('profile-pic').attr('src', resp.user.avatar_url)
                                        )
                                    ),
                                    $('<div>').append(
                                        $('<div>').append(
                                            $('<a>').attr('href', '/profile?u=' + resp.user.username).text(resp.user.username)
                                        ),
                                        $('<div>').append(
                                            $('<small>').text('Last seen ' + resp.user.last_login),
                                            $('<hr>'),
                                            resp.logged_in && resp.logged_in !== username ?
                                            menuOptions :
                                            ''
                                        )
                                    )
                                )
                            )
            
                            $(container).append(
                                menu
                            )
                        }
                    }
                })
            } else {
                $('body').find('.mod-user-menu').remove();
                userMenuOpened = false;
            }
        } else if (e.target.className === 'mod-user-menu' || $(e.target).closest('.mod-user-menu').length) {
            return;
        } else {
            $('body').find('.mod-user-menu').remove();
            userMenuOpened = false;
        }
    }); */

    $('.post-type-button input').on('click', function() {
        $('.post-type-button').removeClass('active');
        $(this).parent().addClass('active');
    });
});