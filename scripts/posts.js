$(document).ready(function() {
    $('#new-post-button').on('click', function() {
        $('#post-form').slideToggle();

        Toggle.button($(this), 'New Post', 'Cancel');
    });

    $('#post-form, .reply-post-form').on('submit', function(e) {
        e.preventDefault();

        let postBody = $(this).find('.ql-editor').html(),
            data = $(this).serialize() + '&post_body=' + postBody;

        Post.submit(data, (resp) => {
            App.handle.response(resp, () => {
                location.reload();
            });
        });
    });
});