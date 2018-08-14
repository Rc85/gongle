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
                /**
                 * @param {Number} userId The user's id
                 * @param {String} privilege The name of the privilege
                 */
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
                /**
                 * @param {String} user The username
                 * @param {String} reason The reason for deleting this user
                 */
                profilePic: (user, reason, callback) => {
                    App.loading.show();

                    $.post({
                        url: '/delete-user-profile-pic',
                        data: {
                            user_id: user.id,
                            username: user.username,
                            reason: reason
                        },
                        success: function(resp) {
                            App.loading.hide();

                            callback(resp);
                        }
                    });
                },
                account: (userId, callback) => {
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
                }
            }
        },
        forum: {
            move: (moveItem, moveTo, type, callback) => {
                App.loading.show();

                $.post({
                    url: '/move-forum',
                    data: {
                        item: moveItem,
                        to: moveTo,
                        type: type
                    },
                    success: (resp) => {
                        App.loading.hide();

                        callback(resp);
                    }
                });
            },
            /**
             * @param {Number} id The id to be deleted
             * @param {String} type A string indicate where to delete from (topic or subtopic)
             */
            delete: (id, type, callback) => {
                App.loading.show();

                $.post({
                    url: '/delete-forum',
                    data: {
                        id: id,
                        type: type
                    },
                    success: (resp) => {
                        App.loading.hide();

                        callback(resp);
                    }
                });
            },
            create: (obj, callback) => {
                App.loading.show();

                console.log($(obj).serialize())

                $.post({
                    url: '/create-forum',
                    data: $(obj).serialize(),
                    success: (resp) => {
                        App.loading.hide();
                        
                        callback(resp);
                    }
                });
            },
            rename: (obj, callback) => {
                App.loading.show();

                $.post({
                    url: '/rename-topic',
                    data: $(obj).serialize(),
                    success: (resp) => {
                        App.loading.hide();

                        callback(resp);
                    }
                });
            }
        },
        report: {
            review: (data, callback) => {
                App.loading.show();

                $.post({
                    url: '/submit-review',
                    data: {
                        id: data[0].value,
                        review_message: data[1].message
                    },
                    success: (resp) => {
                        callback(resp);
                    }
                });
            }
        }
    }
})();