const User = (() => {
    return {
        friend: {
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
        }
    }
})();