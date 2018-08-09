$(document).ready(function() {
    let postId = App.url.param('pid'),
        page = App.url.param('page');

    $('.reply-post-form').on('submit', function(e) {
        e.preventDefault();

        let postBody = $(this).find('.ql-editor').html(),
            data = $(this).serialize() + '&post_body=' + postBody;

        Post.submit(data, (resp) => {
            App.handle.response(resp, () => {
                location.reload();
            });
        });
    });

    $('.reply-post-button').on('click', function() {
        $(this).parent().next().slideToggle();
        
        Toggle.button(this, 'Reply', 'Cancel');
    });

    $('.quote-header').on('click', function() {
        $(this).siblings('.quote-body').slideToggle();
    });

    $('.quote-header button').on('click', function(e) {
        e.stopPropagation();
    });
});