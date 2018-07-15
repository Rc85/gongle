$(document).ready(function() {
    populateCategoriesSelect();

    $('#select-topic').on('change', function() {
        $.post({
            url: '/get-subtopics-by-topics',
            data: {
                topic: $(this).val()
            },
            success: function(resp) {
                $('#select-subtopic').empty();
                $('#select-subtopic').append(
                    $('<option>')
                );

                for (let subtopic of resp.subtopics) {
                    $('#select-subtopic').append(
                        $('<option>').attr('value', subtopic.subtopic_id).text(subtopic.subtopic_title)
                    )
                }
            }
        });
    });

    $('#get-details-form').on('submit', function(e) {
        e.preventDefault();
        showLoading();

        getPostDetails($(this), 1);
    });

    $('.remove-post-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        alertify
        .defaultValue('Your posts violates the terms of service')
        .prompt('Give a reason for violation: Remove post', function(val, e) {
            e.preventDefault();
            showLoading();

            $.post({
                url: '/remove-post',
                data: $(form).serialize(),
                success: function(resp) {
                    hideLoading();

                    if (resp.status === 'success') {
                        alertify.success('Post removed');
                        $('#admin-post-' + resp.post_id).find('.admin-post-control').empty();
                        $('#admin-post-' + resp.post_id).find('.post-status').removeClass('success-badge').addClass('error-badge').text('Removed');
                    } else {
                        alertify.success('An error occurred');
                    }
                }
            });
        }, function(e) {
            e.preventDefault();
            hideLoading();
        });
    });

    menuHandler('admin-menu-button', 'admin-menu');
});