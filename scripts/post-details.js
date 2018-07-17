$(document).ready(function() {
    let postId = urlParams('pid'),
        page = urlParams('page');

    $.post({
        url: '/get-replies',
        data: {
            post_id: postId,
            page: page
        },
        success: function(resp) {
            console.log(resp);
            
            if (resp.status === 'success') {
                createPagination('.post-details-pagination', resp.replies, 10, resp.obj, '/forums/posts/post-details?pid=' + postId + '&page=1')
            }
        }
    });

    $('.reply-post-button').on('click', function() {
        $(this).parent().next().slideToggle();
        
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

    $('.quote-header').on('click', function() {
        $(this).siblings('.quote-body').slideToggle();

        let arrow = $(this).children('i');

        if ($(arrow).hasClass('fa-angle-down')) {
            $(arrow).removeClass('fa-angle-down').addClass('fa-angle-up');
        } else {
            $(arrow).removeClass('fa-angle-up').addClass('fa-angle-down');
        }
    });
});