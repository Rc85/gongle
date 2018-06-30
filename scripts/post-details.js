$(document).ready(function() {
    var urlString = new URL(window.location.href);
    var urlParams = new URLSearchParams(urlString.searchParams.toString());
    var postId = urlParams.get('pid');
    var topicId = urlParams.get('tid');
    var page = urlParams.get('page');

    $.post({
        url: '/get-replies',
        data: {
            post_id: postId,
            topic_id: topicId,
            page: page
        },
        success: function(resp) {
            console.log(resp);
            
            if (resp.status === 'success') {
                createPagination('.post-details-pagination', resp.replies, 10, resp.obj, '/forums/posts/post-details?pid=' + postId + '&tid=' + topicId)
            }
        }
    });

    $('.reply-post-button').on('click', function() {
        $(this).next().slideToggle();
        
        toggleButton(this, 'Reply');
    });

    $('.reply-button').on('click', function() {
        let id = $(this).attr('data-reply-id');

        $('#post-reply-to-' + id + '-form').slideToggle();

        toggleButton(this, 'Reply');
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
});