$(document).ready(function() {
    let postId = App.url.param('pid'),
        page = App.url.param('page');

    getNumberOfReplies(postId, page, function(resp) {
        createPagination('.post-details-pagination', resp.replies, 10, resp.obj, '/forums/posts/post-details?pid=' + postId)
    });

    $('.reply-post-button').on('click', function() {
        $(this).parent().next().slideToggle();
        
        Toggle.button(this, 'Reply', 'Cancel');
    });

    $('#follow-post-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        $.post({
            url: '/follow-post',
            data: $(form).serialize(),
            success: function(resp) {
                if (resp.status === 'followed') {
                    alertify.error('Already following');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                } else if (resp.status === 'success') {
                    $(form).children('button[type=submit]').empty().append(
                        $('<span>').addClass('fa-stack fa-lg').append(
                            $('<i>').addClass('fas fa-star fa-stack-1x followed'),
                            $('<i>').addClass('far fa-star fa-stack-1x')
                        ),
                        'Followed'
                    );
                } else if (resp.status === 'unfollowed') {
                    $(form).children('button[type=submit]').empty().append(
                        $('<i>').addClass('far fa-lg fa-star'),
                        ' Follow'
                    )
                }
            }
        });
    });

    toggleContent('.quote-header', '.quote-body');
});