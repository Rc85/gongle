$(document).ready(function() {
    $(function() {
        $('.forum-sidebar-parent').css({'display': 'flex'});

        Fetch.forums((resp) => {
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

                setTimeout(function() {
                    Forum.sidebar.init((forum) => {
                        Toggle.sidebar('.forum-sidebar-control', '.forum-sidebar-toggler', '.forum-sidebar-parent', forum.parent.width, forum.width);
                    });
                });
            }
        });
    });

    Toggle.tabs('popular', '#forum-body', '#forum-navbar');
    Toggle.tabs('most-active', '#forum-body', '#forum-navbar');
    Toggle.tabs('new-posts', '#forum-body', '#forum-navbar');
});