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

    $('body').on('click', function(e) {
        if (e.target.className === 'user-menu-button') {
            let menu = $(e.target).next();

            if ($(menu).css('display') !== 'none') {
                $(menu).hide();
            } else if ($(menu).css('display') === 'none') {
                $('.mod-user-menu').hide();
                $(menu).show();
            }
        } else if ($(e.target).closest('.user-menu-button').length) {
            let menu = $(e.target).parent().siblings('.mod-user-menu');

            if ($(menu).css('display') === 'block') {
                $(menu).hide();
            } else if ($(menu).css('display') === 'none') {
                $('.mod-user-menu').hide();
                $(menu).show();
            }
        } else if (e.target.className === 'mod-user-menu' || $(e.target).closest('.mod-user-menu').length) {
            return;
        } else {
            $('.mod-user-menu').hide();
        }
    });

    /* $('.user-menu-button').on('click', function(e) {
        e.preventDefault();

        $(this).next().show();
    })  */

    $('.issue-violation').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        alertify
        .prompt('Reason for violation:', function(val, e) {
            e.preventDefault();
            let data = $(form).serialize() + '&reason=' + val;

            showLoading();

            $.post({
                url: '/issue-violation',
                data: data,
                success: function(resp) {
                    console.log(resp);
                    hideLoading();
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
            showLoading();

            $.post({
                url: '/user-report',
                data: $(form).serialize(),
                success: function(resp) {
                    hideLoading();

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

        showLoading();

        $.post({
            url: '/change-post-status',
            data: $(this).serialize(),
            success: function(resp) {
                hideLoading();

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
                }
            }
        });
    });
});