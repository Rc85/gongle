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
        let button = $(this);
        let user = {
            id: $(button).attr('data-id'),
            username: $(button).attr('data-username')
        };
        
        alertify
        .defaultValue('Your profile picture violates the terms of service.')
        .prompt('Another reason for deleting this user\'s profile picture?', function(val, e) {
            e.preventDefault();

            Admin.users.delete.profilePic(user, val, function(resp) {
                App.handle.response(resp, function() {
                    alertify.success('User profile picture deleted');
                    $(button).siblings().children('.profile-pic').attr('src', '/images/profile_default.png');
                });
            });
        },
        function() {
            App.loading.hide();
        });
    });

    $('.admin-user-privilege-menu .admin-menu div').on('click', function() {
        let option = $(this),
            userId = $(option).attr('data-id'),
            privilege = $(option).attr('data-privilege');

        Admin.users.privilege.change(userId, privilege, (resp) => {
            App.handle.response(resp, () => {
                $('.admin-menu').hide();

                alertify.success('User privilege changed');
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
                $('.admin-menu').hide();
                
                App.handle.response(resp, () => {
                    alertify.success('User status changed');
                    Toggle.badge(option, '.admin-user-row', '.admin-user-status');
                });
            });
        } else {
            alertify
            .okBtn('Yes')
            .cancelBtn('No')
            .confirm('Are you sure you want to delete this user? This cannot be reversed.', (e) => {
                e.preventDefault();

                Admin.users.delete.account(userId, (resp) => {
                    App.handle.response(resp, () => {
                        alertify.success('User deleted');
                        $(option).parents('.admin-user-row').remove();
                    });
                });
            },
            function() {
                App.loading.hide();
                return false;
            });
        }

        $('.admin-menu').hide();
    });
});