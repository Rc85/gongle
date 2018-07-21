$(document).ready(function() {
    $('.admin-post-row-title').on('click', function(e) {
        e.preventDefault();

        $(this).parent().siblings('.post-content-container').slideToggle();
    });

    $('.admin-menu div').on('click', function(e) {
        let ele = $(this);

        Admin.status.change(ele, 'posts', function(status) {
            App.handle.response(status, function() {
                Toggle.badge(ele, '.admin-post-row', '.post-status');
            });
        });
    });

    let postId = App.url.param('pid');
    let page = App.url.param('page');

    if (!page) {
        page = 1;
    }

    console.log(page);

    $.post({
        url: '/admin-post-details/get-replies',
        data: {
            post_id: postId,
            page: page
        },
        success: function(resp) {
            if (resp.status === 'success') {
                let totalItems = resp.replies.length;

                createPagination('.admin-post-details-replies-pagination', totalItems, 25, resp.obj, `/admin-page/posts/details?pid=${postId}`);

                /* if (totalItems > 0) {
                    $('#admin-post-details-body').append(
                        $('<div>').addClass('section-container').attr('id', 'admin-post-details-replies').append(
                            function() {
                                for (let reply of resp.replies) {
                                    return $('<div>').addClass('admin-post-container').append(
                                        $('<div>').addClass('admin-post-row').append(
                                            $('<div>').addClass('w-5').html(reply.post_id),
                                            $('<div>').addClass('w-40 admin-post-row-title show-posts').html(reply.post_title),
                                            $('<div>').addClass('w-15').html(reply.post_user),
                                            $('<div>').addClass('w-25').html(reply.post_created),
                                            $('<div>').addClass('w-10').append(
                                                reply.post_status === 'Open' ?
                                                $('<span>').addClass('post-status user-badge success-badge').html(reply.post_status) : '',
                                                reply.post_status === 'Closed' ?
                                                $('<span>').addClass('post-status user-badge error-badge').html(reply.post_status) : '',
                                                reply.post_status === 'Removed' ?
                                                $('<span>').addClass('post-status user-badge critical-badge').html(reply.post_status) : ''
                                            ),
                                            $('<div>').addClass('w-5 text-center').append(
                                                $('<div>').addClass('admin-menu-container').append(
                                                    $('<div>').addClass('admin-menu-button').append(
                                                        $('<i>').addClass('fas fa-lg fa-ellipsis-h')
                                                    ),
                                                    $('<div>').addClass('admin-menu text-left').append(
                                                        $('<div>').attr({'data-post-id': reply.post_id, 'data-status': 'Removed'}).html('Remove').on('click', function() {
                                                            changePostStatus($(this), '.admin-post-row')
                                                        })
                                                    )
                                                )
                                            )
                                        ),
                                        $('<div>').addClass('post-content-container').append(
                                            $('<div>').addClass('post-content').append(
                                                $('<div>').addClass('post-content-body').append(
                                                    reply.post_body,
                                                    reply.post_modified !== 'Invalid date' ?
                                                    $('<div>').addClass('text-right mt-15').append(
                                                        $('<small>').html(`Edited on ${reply.post_modified}`)
                                                    ) : ''
                                                )
                                            )
                                        )
                                    )
                                }
                            }
                        )
                    )
                } */
            }
        }
    });
});