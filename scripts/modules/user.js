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
            }
        }
    }
})();