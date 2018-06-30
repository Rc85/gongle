$(document).ready(function() {
    $('.tab-link-button').on('click', function(e) {
        let clicked = $(this).attr('data-id');
        $('.tab-link-button').removeClass('active');
        $(this).addClass('active');

        e.preventDefault();

        $('.tab-content').hide();
        $('#' + clicked).show();
    });

    function populatePosts(parent, obj, show_body, is_reply) {
        //if (is_reply) {
            var url = '/forums/posts/post-details?pid=' + obj.belongs_to_post_id + '&tid=' + obj.post_topic + '&page=1';
        //} else {
            //var url = '/forums/posts/post-details?pid=' + obj.post_id + '&tid=' + obj.post_topic + '&page=1';
        //}

        $(parent).append(
            $('<div>').addClass('section-container mb-15').append(
                $('<div>').addClass('d-flex').append(
                    $('<div>').addClass('user-vote-div').append(
                        $('<span>').addClass('vote-counter').text(obj.post_upvote + obj.post_downvote),
                        $('<small>').text('Votes')
                    ),
                    $('<div>').append(
                        $('<div>').addClass('d-flex').append(
                            $('<a>').attr('href', url).append(
                                $('<h3>').html(obj.post_title)
                            ),
                            obj.post_status === 'Removed' ? $('<span>').addClass('ml-15 user-badge error-badge').text('Removed') : null
                        ),
                        $('<small>').html('Posted in <a href="/subforums/' + obj.subtopic_title.toLowerCase().replace(' ', '_') + '">' + obj.subtopic_title + '</a> ' + obj.post_created + ' with ' + obj.replies + ' Replies')
                    )
                ),
                (show_body ? $('<div>').addClass('show-posts border-top-light mt-10').html(obj.post_body) : null)
            )
        )
    }

    function getUserPosts(page, type, appendDiv) {
        $.post({
            url: '/get-user-posts',
            data: {
                type: type,
                page: page
            },
            success: function(resp) {
                if (resp.status === 'success') {
                    $(appendDiv).empty();

                    for (let post of resp.posts) {
                        populatePosts(appendDiv, post, true, false);
                    }

                    if (type === 'posts') {
                        var appendPaginationTo = '.profile-posts-pagination';
                    } else {
                        var appendPaginationTo = '.profile-replies-pagination';
                    }

                    if (resp.posts.total_posts > 0) {
                        createPagination(appendPaginationTo, resp.posts.total_posts, 10, false, false, getUserPosts);
                    }
                    
                    console.log(resp)
                } else {
                    $(appendDiv).append(
                        $('<div>').addClass('section-container').html('An error occurred while trying to retrieve your posts.')
                    );
                }
            }
        });
    }

    getUserPosts(1, 'posts', '#user-posts-content');
    getUserPosts(1, 'replies', '#user-replies-content');
    getUserPosts(1, 'followed', '#user-followed-content');

    function randomColor() {
        let char = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color = color + char[Math.floor(Math.random() * 16)];
        }

        return color;
    }

    var urlString = new URL(window.location.href);
    var urlParams = new URLSearchParams(urlString.searchParams.toString());
    var username = urlParams.get('u');

    $.post({
        url: '/get-post-freq',
        data: {
            username: username,
            start_date: '2018-05-01',
            end_date: '2018-05-31'
        },
        success: function(resp) {
            if (resp.status === 'error') {
                $('#post-frequency-chart').addClass('d-flex justify-content-center align-items-center').append(
                    $('<span>').text('An error occurred while trying to retrieve post data.')
                )
            } else {
                let posts = [];
                let replies = [];
                let labels = [];

                for (let i = 0; i < 31; i++) {
                    posts.push(0);
                    replies.push(0);
                    labels.push(i);
                }

                for (let data of resp.data) {
                    let date = new Date(data.date);
                    let index = date.getUTCDate();

                    posts[index] = parseInt(data.posts);
                    replies[index] = parseInt(data.replies);
                }

                var postFreqChart = new Chart($('#post-frequency-chart'), {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: '# of Posts',
                                data: posts,
                                backgroundColor: randomColor()
                            },
                            {
                                label: '# of Replies',
                                data: replies,
                                backgroundColor: randomColor()
                            }
                        ]
                    },
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero:true
                                }
                            }]
                        },
                        legend: {
                            display: true
                        },
                        title: {
                            display: true,
                            text: 'Post Frequency By Month'
                        }
                    } 
                });
            }
        }
    });

    $('#upload-profile-pic-button').on('click', function() {
        $('#upload-profile-pic-input').click();
    });

    $('#upload-profile-pic-input').on('change', function() {
        $('#upload-profile-pic-form').submit();
    });
});