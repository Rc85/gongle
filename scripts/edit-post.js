$(document).ready(function() {
    $('.ql-editor').eq(0).html(postBody);

    $('#edit-post-form').on('submit', function(e) {
        e.preventDefault();

        let postBody = $(this).find('.ql-editor').html(),
            data = $(this).serialize() + '&post_body=' + postBody;
        
        Post.edit(data, (resp) => {
            App.handle.response(resp, (resp) => {
                console.log(resp.link);
            });
        });
    });
});