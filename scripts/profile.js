$(document).ready(function() {
    let username = App.url.param('u');

    $('.unfriend-button').on('click', function(e) {
        e.preventDefault();

        let button = $(this);
        let id = $(this).attr('data-id');

        alertify.confirm('Are you sure you want to unfriend this user? This cannot be reversed.', function(e) {
            e.preventDefault();

            User.friend.remove(id, (resp) => {
                App.handle.response(resp, () => {
                    alertify.success('Unfriend successful');
                    $(button).parents('.friend-container').remove();
                });
            });
        }, function() {
            App.loading.hide();
            return false;
        });
    });

    /* function getFriendsList(page) {
        App.loading.show();

        $.post({
            url: '/get-friends',
            data: {
                username: username,
                page: page
            },
            success: function(resp) {
                App.loading.hide();

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

                                        App.loading.show();

                                        $.post({
                                            url: '/unfriend',
                                            data: {
                                                fid: friend.fid
                                            },
                                            success: function(resp) {
                                                console.log(resp);
                                                App.loading.hide();

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
    } */

    /* $('#user-posts-button').on('click', function(e) {
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
    }); */

    function randomColor() {
        let char = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color = color + char[Math.floor(Math.random() * 16)];
        }

        return color;
    }

    let calculateDate = (m) => {
        let dateObj = new Date();
        let year = dateObj.getUTCFullYear();
        let monthInt;

        if (!m) {
            monthInt = dateObj.getUTCMonth() + 1;
        } else {
            monthInt = parseInt(m);
        }

        let month;
        let day = 01;
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        let monthName = months[monthInt - 1];

        if (monthInt < 10) {
            month = '0' + monthInt;
        } else {
            month = monthInt;
        }

        let startDate = `${year}-${month}-${day}`;
        let endDate;

        let oddMonths = [1, 3, 5, 7, 8, 10, 12];
        let lastDayOfMonth;

        if (oddMonths.indexOf(monthInt) !== -1) {
            lastDayOfMonth = 31;
        } else {
            lastDayOfMonth = 30;

            if (monthInt === 2) {
                if (year % 4 === 0) {
                    lastDayOfMonth = 29;
                } else {
                    lastDayOfMonth = 28;
                }
            }
        }

        console.log(lastDayOfMonth);

        endDate = `${year}-${month}-${lastDayOfMonth}`;

        return {
            month: {
                name: monthName,
                lastDay: lastDayOfMonth
            },
             start: startDate, end: endDate, 
        };
    }

    /* let dateObj = new Date();
    let year = dateObj.getUTCFullYear();
    let monthInt = dateObj.getUTCMonth() + 1;
    let month;
    let day = 01;
    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let monthName = months[monthInt - 1];

    if (month < 10) {
        month = '0' + monthInt;
    } else {
        month = monthInt;
    }

    let startDate = `${year}-${month}-${day}`;
    let endDate;

    let oddMonths = [1, 3, 5, 7, 8, 10, 12];
    let lastDayOfMonth;

    if (oddMonths.indexOf(monthInt)) {
        lastDayOfMonth = 31;
    } else {
        lastDayOfMonth = 30;

        if (monthInt === 2) {
            if (year % 4 === 0) {
                lastDayOfMonth = 29;
            } else {
                lastDayOfMonth = 28;
            }
        }
    }

    endDate = `${year}-${month}-${lastDayOfMonth}`; */

    function getPostFrequency(user, date) {
        let startDate = date.start;
        let endDate = date.end;
        let lastDayOfMonth = date.month.lastDay;
        let monthName = date.month.name;

        $.post({
            url: '/get-post-freq',
            data: {
                username: user,
                start_date: startDate,
                end_date: endDate
            },
            success: function(resp) {
                console.log(resp);
                if (resp.status === 'error') {
                    $('#post-frequency-chart').addClass('d-flex justify-content-center align-items-center').append(
                        $('<span>').text('An error occurred while trying to retrieve post data.')
                    )
                } else {
                    let posts = [];
                    let replies = [];
                    let labels = [];
    
                    for (let i = 0; i < lastDayOfMonth + 1; i++) {
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
                                text: `Post Frequence of ${monthName}`
                            },
                            tooltip: {
                                mode: 'dataset',
                                intersect: true
                            }
                        } 
                    });
                }
            }
        });
    }

    getPostFrequency(username, calculateDate());

    $('#select-month').on('change', function() {
        let month = $(this).val();

        getPostFrequency(username, calculateDate(month));
    });

    $('#upload-profile-pic-button').on('click', function() {
        $('#upload-profile-pic-input').click();
    });

    $('#upload-profile-pic-input').on('change', function() {
        $('#upload-profile-pic-form').submit();
    });

    $('.expand-post-body').on('click', function() {
        $(this).siblings('.user-post-body').slideToggle();

        if ($(this).children().hasClass('fa-angle-down')) {
            $(this).children().removeClass('fa-angle-down').addClass('fa-angle-up');
        } else {
            $(this).children().removeClass('fa-angle-up').addClass('fa-angle-down');
        }
    })
});