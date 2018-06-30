$(document).ready(function() {
    $('.settings-form').on('submit', function(e) {
        e.preventDefault();
        var form = $(this);
        showLoading();

        $.post({
            url: '/change-settings',
            data: $(form).serialize(),
            success: function(resp) {
                hideLoading();

                if (resp.status === 'success') {
                    alertify.success('Saved');
                } else {
                    alertify.error('An error occurred');
                }
            }
        });
    });
});