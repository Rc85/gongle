$(document).ready(function() {
    $(function() {
        $('.forum-sidebar-parent').css({'display': 'flex'});

        $.get({
            url: '/get-forum-sidebar',
            success: function(resp) {
                if (resp.status === 'success') {
                    for (let i in resp.menu) {
                        let topics = $('<section>').addClass('mb-15');
    
                        for (let key in resp.menu[i]) {
                            let keyCheck = /General$/,
                                newKey = key,
                                newLink = '/subforums/' + key.toLowerCase().replace(' ', '_').replace('/', '');
    
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
                // Adjust the sidebar to fit the parent div
                setTimeout(function() {
                    let forumSidebar = 'shown',
                        forumSidebarParentWidth = $('.forum-sidebar-parent').outerWidth(),
                        forumsSidebarControlWidth = $('.forum-sidebar-control').outerWidth(),
                        forumSidebarWidth = forumSidebarParentWidth - forumsSidebarControlWidth,
                        forumSidebarHeight = $('body').outerHeight(true) - ($('#top-bar').outerHeight(true) + $('#nav-bar').outerHeight(true) + $('#footer').outerHeight(true) - 1);

                    $('.forum-sidebar-parent').css({'height': forumSidebarHeight, 'left': '0'});
                    $('main').css({'padding-left': forumSidebarParentWidth + 30});

                    toggleSidebar('.forum-sidebar-control', '.forum-sidebar-toggler', '.forum-sidebar-parent', forumSidebarParentWidth, forumSidebarWidth, function(value) {
                        forumSidebar = value;
                    });
                });
            }
        });
    });

    Toggle.tabs('popular', '#forum-body', '#forum-navbar');
    Toggle.tabs('most-active', '#forum-body', '#forum-navbar');
    Toggle.tabs('new-posts', '#forum-body', '#forum-navbar');
});