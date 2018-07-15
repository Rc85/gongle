function changeConfig(config) {
    $(config).on('click', function() {
        console.log($(this))
        let status = $(this).attr('data-status'),
            configId = $(this).attr('data-config-id');

        showLoading();

        $.post({
            url: '/change-config',
            data: {
                status: status,
                config_id: configId
            },
            success: function(resp) {
                console.log(resp);
                hideLoading();

                if (resp.status === 'success') {
                    if (resp.config === 'Site') {
                        if (resp.config_status === 'Open') {
                            alertify.success('Site opened');
                            $('#site-status').removeClass('critical-badge').addClass('success-badge').text(resp.config_status);
                        } else {
                            alertify.success('Site closed');
                            $('#site-status').removeClass('success-badge').addClass('critical-badge').text(resp.config_status);
                        }
                    } else {
                        if (resp.config_status === 'Open') {
                            alertify.success('Registration opened');
                            $('#registration-status').removeClass('critical-badge').addClass('success-badge').text(resp.config_status);
                        } else {
                            alertify.success('Registration closed');
                            $('#registration-status').removeClass('success-badge').addClass('critical-badge').text(resp.config_status);
                        }
                    }
                } else {
                    alertify.error('An error occurred');
                }
            }
        });
    });
}

$(document).ready(function() {
    $('#change-site-status, #change-registration-status-form').on('change', function() {
        $(this).submit();
    });

    menuHandler('admin-menu-button', 'admin-menu');

    changeConfig('.site-config-option');
    changeConfig('.reg-config-option');

    /* $('.change-config-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);
        console.log($(this))

        if ($(this).children('select').val() !== '') {
            showLoading();

            $.post({
                url: '/change-config',
                data: $(form).serialize(),
                success: function(resp) {
                    console.log(resp);
                    hideLoading();

                    if (resp.status === 'success') {
                        if (resp.config === 'Site') {
                            if (resp.config_status === 'Open') {
                                alertify.success('Site opened');
                                $('#site-status').removeClass('critical-badge').addClass('success-badge').text(resp.config_status);
                            } else {
                                alertify.success('Site closed');
                                $('#site-status').removeClass('success-badge').addClass('critical-badge').text(resp.config_status);
                            }
                        } else {
                            if (resp.config_status === 'Open') {
                                alertify.success('Registration opened');
                                $('#registration-status').removeClass('critical-badge').addClass('success-badge').text(resp.config_status);
                            } else {
                                alertify.success('Registration closed');
                                $('#registration-status').removeClass('success-badge').addClass('critical-badge').text(resp.config_status);
                            }
                        }
                    } else {
                        alertify.error('An error occurred');
                    }
                }
            });
        }
    }); */
});