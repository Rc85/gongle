$(document).ready(function() {
    Fetch.categories(function(categories) {
        for (let category of categories) {
            $('#select-category').append(
                $('<option>').attr('value', category.category_id).text(category.category)
            )
        }

        $('#select-category').on('change', function() {
            Fetch.topics($(this).val(), function(topics) {
                $('#select-topic').empty();
                $('#select-topic').append($('<option>'));

                for (let topic of topics) {
                    $('#select-topic').append(
                        $('<option>').attr('value', topic.topic_id).text(topic.topic_title)
                    )
                }
            });
        });
    });

    /* $('#admin-get-details-form').on('submit', function(e) {
        e.preventDefault();
        showLoading();
        console.log($(this).serialize());

        //getPostDetails($(this), 1);
        $.get({
            url: '/posts?' + $(this).serialize(),
            success: function(resp) {

            }
        })
    }); */

    $('.admin-menu div').on('click', function() {
        let ele = $(this);

        Admin.status.change(ele, 'posts', function(status) {
            App.handle.response(status, function() {
                Toggle.badge(ele, '.admin-post-row', '.post-status');
            });
        });
    });

    /* $('.remove-post-form').on('submit', function(e) {
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
    }); */
});