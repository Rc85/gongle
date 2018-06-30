$(document).ready(function() {
    $('.users-username').on('click', function() {
        let header = $(this);
        let details = $(header).parent().siblings('.user-details');

        $(details).slideToggle(function() {
            if ($(details).css('display') === 'block') {
                $(header).children('i').removeClass('fa-angle-down').addClass('fa-angle-up');
            } else {
                $(header).children('i').removeClass('fa-angle-up').addClass('fa-angle-down');
            }
        });
    });

    $('.privilege-select').on('change', function() {
        $(this).parent().submit();
    });

    $('.user-privilege-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        alertify
        .okBtn('Yes')
        .cancelBtn('No')
        .confirm('Are you sure you want to change this user\'s privilege?', function(e) {
            e.preventDefault();
            showLoading();

            $.post({
                url: '/change-user-privilege',
                data: $(form).serialize(),
                success: function(resp) {
                    hideLoading();

                    if (resp.status === 'success') {
                        alertify.success('User\'s privilege changed');
                    } else {
                        alertify.error('An error occurred');
                    }
                }
            });
        }, function(e) {
            e.preventDefault();
            hideLoading();
        });
    });

    $('.status-select').on('change', function() {
        $(this).parent().submit();
    });

    $('.change-user-status-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);
        let select = $(this).children('select');
        
        changeUserStatus(form, $(select).val(), '.user-section');
    });

    $('.delete-user-profile-pic-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        alertify
        .defaultValue('Your profile picture violates the terms of service.')
        .prompt('Another reason for deleting this user\'s profile picture?', function(val, e) {
            e.preventDefault();
            showLoading();

            $.post({
                url: '/delete-user-profile-pic',
                data: $(form).serialize() + '&reason=' + val,
                success: function(resp) {
                    hideLoading();

                    if (resp.status === 'success') {
                        alertify.success('User profile picture deleted');

                        $(form).siblings('.profile-pic').attr('src', '/images/profile_default.png');
                    } else {
                        alertify.success('An error occurred');
                    }
                }
            }) 
        }, function(e) {
            e.preventDefault();
            hideLoading();
        });
    });

    $('.search-users-form').on('submit', function(e) {
        e.preventDefault();

        let paramString = '';
        let searchParams = new URLSearchParams($(this).serialize());

        for (let key of searchParams.keys()) {
            if (searchParams.get(key) !== '') {
                let newString = key + '=' + searchParams.get(key) + '&';
                paramString += newString;
            }
        }

        location.href = '/admin-page/users?' + paramString;
    })
});