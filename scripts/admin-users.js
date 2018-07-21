$(document).ready(function() {
    $('.admin-user-username').on('click', function() {
        let header = $(this);
        let details = $(header).parents().siblings('.user-details');

        $(details).slideToggle(function() {
            if ($(details).css('display') === 'block') {
                $(header).children('i').removeClass('fa-angle-down').addClass('fa-angle-up');
            } else {
                $(header).children('i').removeClass('fa-angle-up').addClass('fa-angle-down');
            }
        });
    });

    $('.delete-user-profile-pic').on('click', function() {
        let button = $(this),
            user = {
                id: $(button).attr('data-id'),
                username: $(button).attr('data-username')
            };

        Admin.users.delete.profilePic(user, function(resp) {
            App.handle.response(resp.status, function() {
                alertify.success('User profile picture deleted');

                $(button).siblings().children('.profile-pic').attr('src', '/images/profile_default.png');
            });
        });
    });

    $('.admin-user-privilege-menu .admin-menu div').on('click', function() {
        let option = $(this),
            userId = $(option).attr('data-id'),
            privilege = $(option).attr('data-privilege');

        Admin.users.privilege.change(userId, privilege, (resp) => {
            App.handle.response(resp.status, () => {
                $(option).parents().siblings('.admin-user-privilege').text(privilege);
            });
        });
    });

    $('.admin-user-status-menu .admin-menu div').on('click', function() {
        let option = $(this),
            userId = $(option).attr('data-id'),
            status = $(option).attr('data-status');

        if (status !== 'Delete') {
            Admin.status.change(option, 'users', (resp) => {
                App.handle.response(resp.status, () => {
                    Toggle.badge(option, '.admin-user-row', '.admin-user-status');
                });
            });
        } else {
            Admin.users.delete.account(userId, (resp) => {
                if (resp.status === 'success') {
                    $(option).parents('.admin-user-row').remove();
                    alertify.success('Deleted');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            });
        }
    });
});