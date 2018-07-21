const Admin = (() => {
    const _changeStatus = (type, id, status, callback) => {
        App.loading.show();

        $.post({
            url: '/change-status',
            data: {
                type: type,
                id: id,
                status: status
            },
            success: (resp) => {
                App.loading.hide();

                callback(resp);
            }
        });
    }

    return {
        status: {
            /**
             * @param {Element} e The element that contains the data-id and data-status attribute
             * @param {String} type The entity name in plural form (categories, topics, posts, users)
             * @param {Function} callback Callback with argument of server response
             */
            change: (e, type, callback) => {
                let id = $(e).attr('data-id'),
                    status = $(e).attr('data-status');

                _changeStatus(type, id, status, (resp) => {
                    callback(resp);
                });
            }
        },
        users: {
            privilege: {
                change: (userId, privilege, callback) => {
                    App.loading.show();

                    $.post({
                        url: '/change-user-privilege',
                        data: {
                            user_id: userId,
                            privilege: privilege
                        },
                        success: (resp) => {
                            App.loading.hide();

                            callback(resp);
                        }
                    });
                }
            },
            delete: {
                profilePic: (user, callback) => {
                    alertify
                    .defaultValue('Your profile picture violates the terms of service.')
                    .prompt('Another reason for deleting this user\'s profile picture?', function(val, e) {
                        e.preventDefault();
                        App.loading.show();

                        $.post({
                            url: '/delete-user-profile-pic',
                            data: {
                                user_id: user.id,
                                username: user.username,
                                reason: val
                            },
                            success: function(resp) {
                                App.loading.hide();

                                callback(resp);
                            }
                        }) 
                    }, function(e) {
                        e.preventDefault();
                        App.loading.hide();
                    });
                },
                account: (userId, callback) => {
                    alertify
                    .okBtn('Yes')
                    .cancelBtn('No')
                    .confirm('Are you sure you want to delete this user? This cannot be reversed.', (e) => {
                        e.preventDefault();
                        App.loading.show();

                        $.post({
                            url: '/delete-user',
                            data: {
                                user_id: userId
                            },
                            success: (resp) => {
                                App.loading.hide();

                                callback(resp);
                            }
                        });
                    },
                    () => {
                        App.loading.hide();
                        return false;
                    });
                }
            }
        }   
    }
})();