$(document).ready(function() {
    $('#change-site-status').on('change', function() {
        $('#change-site-status-form').submit();
    });

    $('.change-config-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        if ($(this).children('select').val() === 'Open') {
            var confirm = 'Are you sure you want to open the site?';
        } else {
            var confirm = 'Are you sure you want to close the site?';
        }

        if ($(this).children('select').val() !== '') {
            alertify
            .okBtn('Yes')
            .cancelBtn('No')
            .confirm(confirm, function(e) {
                e.preventDefault();
                showLoading();

                $.post({
                    url: '/change-config',
                    data: $(form).serialize(),
                    success: function(resp) {
                        hideLoading();

                        if (resp.status === 'success') {
                            alertify.success('Successful');

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
            }, function(e) {
                e.preventDefault();
                hideLoading();
            });
        }
    });
});