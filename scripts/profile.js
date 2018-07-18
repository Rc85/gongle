$(document).ready(function() {
    let username = urlParams('u'),
        postsLoaded = false,
        repliesLoaded = false,
        followedPostsLoaded = false,
        friendsListLoaded = false;

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
            let url = '/forums/posts/post-details?pid=' + obj.belongs_to_post_id + '&page=1';
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
                            obj.post_status === 'Removed' ?
                            $('<span>').addClass('ml-15 user-badge critical-badge').append(
                                $('<i>').addClass('fas fa-minus mr-5'),
                                'Removed'
                            ) :
                            $('<span>').addClass('ml-15 user-badge error-badge').append(
                                $('<i>').addClass('fas fa-comment-slash mr-5'),
                                'Closed'
                            )
                        ),
                        $('<small>').html('Posted in <a href="/subforums/' + obj.subtopic_title.toLowerCase().replace(' ', '_') + '">' + obj.subtopic_title + '</a> ' + obj.post_created + ' with ' + obj.replies + ' Replies')
                    )
                ),
                (show_body ? $('<div>').addClass('show-posts border-top-light mt-10').html(obj.post_body) : null)
            )
        )
    }

    function getUserPosts(page, type, appendDiv) {
        showLoading();

        $.post({
            url: '/get-user-posts',
            data: {
                type: type,
                page: page
            },
            success: function(resp) {
                hideLoading();
                if (type === 'posts') {
                    postsLoaded = true;
                } else if (type === 'replies') {
                    repliesLoaded = true;
                } else if (type === 'followed') {
                    followedPostsLoaded = true;
                }

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
                } else {
                    $(appendDiv).append(
                        $('<div>').addClass('section-container').html('An error occurred while trying to retrieve your posts.')
                    );
                }
            }
        });
    }

    function getFriendsList(page) {
        showLoading();

        $.post({
            url: '/get-friends',
            data: {
                username: username,
                page: page
            },
            success: function(resp) {
                hideLoading();

                friendsListLoaded = true;

                for (let friend of resp.friends) {
                    $('#user-friends-content').append(
                        $('<section>').addClass('section-container d-flex w-45').append(
                            $('<div>').addClass('w-10 mr-10').append(
                                $('<a>').attr('href', '/profile?u=' + friend.befriend_with).append(
                                    $('<img>').addClass('w-100').css({'border-radius': '100%'}).attr('src', friend.avatar_url)
                                )
                            ),
                            $('<div>').addClass('w-75').append(
                                $('<div>').append(
                                    $('<a>').attr('href', '/profile?u=' + friend.befriend_with).html(friend.befriend_with),
                                    friend.online_status === 'Online' ?
                                    $('<span>').addClass('ml-10 user-badge success-badge').text('Online') :
                                    $('<span>').addClass('ml-10 user-badge user-badge-newcomer').text('Offline')
                                ),
                                $('<div>').append(
                                    $('<small>').text('Became friends ' + friend.became_friend_on)
                                ),
                                $('<div>').append(
                                    $('<small>').text('Last seen ' + friend.last_login)
                                )
                            ),
                            $('<div>').addClass('d-flex justify-content-around w-15').append(
                                $('<a>').attr('href', '/message/compose?u=' + friend.befriend_with).append(
                                    $('<i>').addClass('fas fa-envelope')
                                ),
                                $('<a>').attr('href', '#').append(
                                    $('<i>').addClass('fas fa-user-minus')
                                ).on('click', function(e) {
                                    e.preventDefault();
                                    let friendDiv = $(this).parent().parent();

                                    alertify
                                    .okBtn('Yes')
                                    .cancelBtn('No')
                                    .confirm('Are you sure you want to unfriend this user?', function(e) {
                                        e.preventDefault();

                                        showLoading();

                                        $.post({
                                            url: '/unfriend',
                                            data: {
                                                fid: friend.fid
                                            },
                                            success: function(resp) {
                                                console.log(resp);
                                                hideLoading();

                                                if (resp.status === 'success') {
                                                    friendDiv.remove();
                                                    alertify.success('You\'re two are no longer friends.');
                                                } else if (resp.status === 'failed') {
                                                    alertify.error('An error occurred during delete');
                                                } else if (resp.status === 'error') {
                                                    alertify.error('An error occurred');
                                                } else if (resp.status === 'not found') {
                                                    alertify.error('Friend not found');
                                                }
                                            }
                                        });
                                    });
                                })
                            )
                        )
                    )
                }
            }
        });
    }

    $('#user-posts-button').on('click', function(e) {
        if (!postsLoaded) {
            getUserPosts(1, 'posts', '#user-posts-content');
        }
    });

    $('#user-replies-button').on('click', function() {
        if (!repliesLoaded) {
            getUserPosts(1, 'replies', '#user-replies-content');
        }
    });

    $('#user-followed-posts-button').on('click', function() {
        if (!followedPostsLoaded) {
            getUserPosts(1, 'followed', '#user-followed-content');
        }
    });

    $('#user-friends-button').on('click', function() {
        if (!friendsListLoaded) {
            getFriendsList();
        }
    });

    function randomColor() {
        let char = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color = color + char[Math.floor(Math.random() * 16)];
        }

        return color;
    }

    let dateObj = new Date();
    let year = dateObj.getUTCFullYear();
    let monthInt = dateObj.getUTCMonth() + 1;
    let month;
    let day;

    if (month < 10) {
        month = '0' + monthInt;
    } else {
        month = monthInt;
    }

    let dayInt = dateObj.getUTCDate();

    if (day < 10) {
        day = '0' + dayInt;
    } else {
        day = dayInt;
    }

    let startDate = year + '-' + month + '-' + day;
    let endDate;

    let oddMonths = [1, 3, 5, 7, 8, 10, 12];

    if (oddMonths.indexOf(monthInt)) {
        endDate = year + '-' + month + '-31';
    } else {
        if (monthInt === 2) {
            if (year % 4 === 0) {
                endDate = year + '-' + month + '-29'; 
            } else {
                endDate = year + '-' + month + '-28'; 
            }
        } else {
            endDate = year + '-' + month + '-30';
        }
    }

    $.post({
        url: '/get-post-freq',
        data: {
            username: username,
            start_date: startDate,
            end_date: endDate
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