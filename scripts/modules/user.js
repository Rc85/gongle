const User = (() => {
    return {
        friend: {
            add: (form, callback) => {
                App.loading.show();

                $.post({
                    url: '/add-friend',
                    data: $(form).serialize(),
                    success: function(resp) {
                        App.loading.hide();

                        callback(resp);
                    }
                });
            },
            accept: (url, callback) => {
                App.loading.show();

                $.get({
                    url: url,
                    success: function(resp) {
                        App.loading.hide();
        
                        callback(resp);
                    }
                });
            },
            remove: (id, callback) => {
                App.loading.show();

                $.post({
                    url: '/unfriend',
                    data: {
                        fid: id
                    },
                    success: (resp) => {
                        App.loading.hide();

                        callback(resp);
                    }
                });
            }
        },
        status: (form, callback) => {
            App.loading.show();

            $.post({
                url: '/change-status',
                data: $(form).serialize(),
                success: (resp) => {
                    App.loading.hide();

                    callback(resp);
                }
            });
        }
    }
})();