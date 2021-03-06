const Forum = (() => {
    return {
        sidebar: {
            init: (callback) => {
                let forumSidebarParentWidth = $('.forum-sidebar-parent').outerWidth(),
                    forumsSidebarControlWidth = $('.forum-sidebar-control').outerWidth(),
                    forumSidebarWidth = forumSidebarParentWidth - forumsSidebarControlWidth,
                    forumSidebarHeight = $('body').outerHeight(true) - ($('#top-bar').outerHeight(true) + $('#nav-bar').outerHeight(true) + $('#footer').outerHeight(true) - 1);

                $('.forum-sidebar-parent').css({'height': forumSidebarHeight, 'left': '0'});
                $('main').css({'padding-left': forumSidebarParentWidth + 30});

                let dimensions = {
                    width: forumSidebarWidth,
                    parent: {
                        width: forumSidebarParentWidth,
                    }
                }

                callback(dimensions);
            }
        }
    }
})();

const Post = (() => {
    return {
        submit: (data, callback) => {
            App.loading.show();

            $.post({
                url: '/post',
                data: data,
                success: function(resp) {
                    App.loading.hide();

                    callback(resp);
                }
            });
        },
        follow: (post, callback) => {
            App.loading.show();

            $.post({
                url: '/follow-post',
                data: $(post).serialize(),
                success: function(resp) {
                    App.loading.hide();

                    callback(resp);
                }
            });
        },
        edit: (data, callback) => {
            App.loading.show();

            $.post({
                url: '/edit-post',
                data: data,
                success: function(resp) {
                    App.loading.hide();

                    callback(resp);
                }
            });
        },
        report: (form, callback) => {
            App.loading.show();

            $.post({
                url: '/user-report',
                data: $(form).serialize(),
                success: function(resp) {
                    App.loading.hide();

                    callback(resp);
                }
            });
        },
        vote: (id, vote, callback) => {
            $.post({
                url: '/vote-post',
                data: {
                    id: id,
                    vote: vote  
                },
                success: (resp) => {
                    callback(resp)
                }
            });
        },
        status: (form, callback) => {
            App.loading.show();

            $.post({
                url: '/change-status',
                data: $(form).serialize(),
                success: function(resp) {
                    App.loading.hide();

                    callback(resp);
                }
            });
        }
    }
})();