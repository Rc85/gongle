const Message = (() => {
    return {
        send: (form, callback) => {
            App.loading.show();

            $.post({
                url: '/send-message',
                data: $(form).serialize(),
                success: function(resp) {
                    App.loading.hide();
    
                    callback(resp);
                }
            });
        },
        save: (form, callback) => {
            App.loading.show();

            $.post({
                url: '/save-message',
                data: $(form).serialize(),
                success: function(resp) {
                    App.loading.hide();
    
                    callback(resp);
                }
            });
        },
        delete: function(message, all, callback) {
            App.loading.show();

            console.log(all);
            if (all) {
                console.log(message.length)
                if (message.length > 0) {
                    App.loading.show();
                    
                    $.post({
                        url: '/delete-all-messages',
                        data: {
                            type: 'messages',
                            ids: message
                        },
                        success: function(resp) {
                            App.loading.hide();
    
                            if (resp.status === 'nothing') {
                                alertify('Nothing to delete');
                            }

                            callback(resp);
                        }
                    });
                } else {
                    alertify.error('Nothing to delete');
                }
            } else {
                $.post({
                    url: '/delete-message',
                    data: $(message).serialize(),
                    success: function(resp) {
                        App.loading.hide();
    
                        callback(resp);
                    }
                });
            }
        },
        report: (form, callback) => {
            alertify.confirm('Are you sure you want to report this message?', (e) => {
                e.preventDefault();
                App.loading.show();

                $.post({
                    url: '/report-message',
                    data: $(form).serialize(),
                    success: (resp) => {
                        App.loading.hide();

                        callback(resp);
                    }
                });
            }, () => {
                return false;
            });
        },
        unsave: (form, callback) => {
            alertify.confirm('Are you sure you want to unsave this message?', (e) => {
                e.preventDefault();

                App.loading.show();

                $.post({
                    url: '/unsave-message',
                    data: $(form).serialize(),
                    success: (resp) => {
                        App.loading.hide();

                        callback(resp);
                    }
                });
            }, () => {
                return false;
            });
        }
    }
})();