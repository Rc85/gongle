$(document).ready(function() {
    let url = location.href,
        urlParts = url.split('/'),
        topic = urlParts[4],
        subtopic = urlParts[5].split('?')[0],
        page = App.url.param('page');
    
    $('#new-post-button').on('click', function() {
        $('#post-form').slideToggle();

        Toggle.button($(this), 'New Post', 'Cancel');
    });
    
    if (!page) {
        page = 1;
    }

    Fetch.posts.count(subtopic, page, function(resp) {
        createPagination('.pagination-container', resp.total_posts, 25, resp.obj, `/subforums/${topic}/${subtopic}?`);
    });

    $('#post-form, .reply-post-form').on('submit', function(e) {
        e.preventDefault();

        // Construct post data
        let postBody = $(this).find('.ql-editor').html(),
            data = $(this).serialize() + '&post_body=' + postBody;

        submitPost(data);
    });
});