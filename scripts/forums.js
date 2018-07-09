$(document).ready(function() {
    let urlParts = location.href.split('/');
    let subtopic = urlParts.pop().split('?')[0];
    let url = new URL(location.href);
    let urlSearchParams = new URLSearchParams(url.searchParams.toString());
    let page = urlSearchParams.get('page');

    $('#new-post-button').on('click', function() {
        $('#post-form').slideToggle();

        toggleButton($(this), 'New Post')
    });

    $.get({
        url: '/get-num-of-posts-in/' + subtopic + '/' + page,
        success: function(resp) {
            console.log(resp);
            createPagination('.pagination-container', resp.total_posts, 25, resp.obj, location.href.split('?')[0]);
        }
    });

    $($('main').height).on('change', function() {
        console.log('changed');
    })

    $(function() {
        $('.forum-sidebar-parent').css({'display': 'flex'});

        $.get({
            url: '/get-forum-sidebar',
            success: function(resp) {
                if (resp.status === 'success') {
                    for (let i in resp.menu) {
                        var topics = $('<section>').addClass('mb-15');
    
                        for (let key in resp.menu[i]) {
                            let keyCheck = /General$/;
                            let newKey = key;
                            let newLink = '/subforums/' + key.toLowerCase().replace(' ', '_').replace('/', '');
    
                            if (keyCheck.test(key)) {
                                newKey = 'General';
                                newLink = '/subforums/' + key.toLowerCase().replace(' ', '_').replace('/', '') + '/' + key.toLowerCase().replace(' ', '_');
                            }
    
                            $(topics).append(
                                $('<section>').addClass('mb-5').append(
                                    $('<a>').attr('href', newLink).html(newKey)
                                )
                            )
                        }
    
                        $('#forum-sidebar').append(
                            $('<header>').addClass('header').append(
                                $('<div>').addClass('forum-sidebar-header').append(
                                    $('<a>').attr('href', '/forums/' + i.toLowerCase().replace(' ', '_').replace('/', '')).text(i)
                                )
                            ),
                            $(topics)
                        )
                    }
                }
            },
            complete: function() {
                setTimeout(function() {
                    let forumSidebar = 'shown';
                    let forumSidebarParentWidth = $('.forum-sidebar-parent').outerWidth();
                    let forumsSidebarControlWidth = $('.forum-sidebar-control').outerWidth();
                    let forumSidebarWidth = forumSidebarParentWidth - forumsSidebarControlWidth;
                    let forumSidebarHeight = $('body').outerHeight(true) - ($('#top-bar').outerHeight(true) + $('#nav-bar').outerHeight(true) + $('#footer').outerHeight(true) - 1);

                    $('.forum-sidebar-parent').css({'height': forumSidebarHeight, 'left': '0'});
                    $('main').css({'padding-left': forumSidebarParentWidth + 30});

                    $('.forum-sidebar-control').on('click', function() {
                        var sidebarToggler = $('.forum-sidebar-toggler');
                        if (forumSidebar === 'shown') {
                            $('.forum-sidebar-parent').animate({'left': '-' + forumSidebarWidth + 'px'}, function() {
                                $(sidebarToggler).children('i').removeClass('fa-angle-double-left').addClass('fa-angle-double-right');
                            });
                            forumSidebar = 'hidden';
                            $('main').animate({'padding-left': forumSidebarParentWidth - forumSidebarWidth + 30});
                        } else {
                            $('.forum-sidebar-parent').animate({'left': '0'}, function() {
                                $(sidebarToggler).children('i').removeClass('fa-angle-double-right').addClass('fa-angle-double-left');
                            });
                            forumSidebar = 'shown';
                            $('main').animate({'padding-left': forumSidebarParentWidth + 30});
                        }
                    });
                })
            }
        });
    });
});