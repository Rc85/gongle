const App = (() => {
    return {
        loading: {
            show: () => {
                $('body').css({'overflow-y': 'hidden'});
            
                $('body').prepend(
                    $('<div>').addClass('loading-screen').css({'top': $(window).scrollTop()}).append(
                        $('<div>').addClass('loading-component').append(
                            $('<i>').addClass('fas fa-5x fa-spinner fa-spin'),
                            $('<span>').text('Please wait...')
                        )
                    )
                )
            },
            hide: () => {
                $('body').css({'overflow-y': ''});
            
                $('.loading-screen').remove();
            }
        },
        handle: {
            /**
             * @param {Object} resp The response object from server
             */
            response: (resp, callback) => {
                console.log(resp);
                if (resp.status === 'success') {
                    if (callback) {
                        callback(resp);
                    }
                } else if (resp.status === 'not found') {
                    alertify.error('Not found');
                } else if (resp.status === 'unauthorized') {
                    alertify.error('You\'re not authorized');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                } else if (resp.status === 'fail') {
                    alertify.error('Failed to execute that action');
                } else if (resp.status === 'deleted') {
                    alertify.success('Deleted');
                } else if (resp.status === 'duplicate') {
                    alertify.error('Duplicate found')
                } else if (resp.status === 'requested') {
                    alertify.error('Request already sent');
                }
            }
        },
        url: {
            param: (p) => {
                let urlString = new URL(window.location.href),
                    urlParams = new URLSearchParams(urlString.searchParams.toString()),
                    param = urlParams.get(p);

                return param;
            }
        }
    }
})();

const Register = (() => {
    const _confirmation = (status) => {
        return {'background-image': 'url("/images/' + status + '.png")', 'background-repeat': 'no-repeat', 'background-position-y': 'center', 'background-position-x': '99%', 'padding-right': '30px', 'background-size': '25px'}
    }

    return {
        check: {
            /** Check the database as the user types for the availability of their input
             * @param {String} value The name of the input
             */
            exist: (value) => {
                $('#register-form').find('input[name="' + value + '"]').on('blur', function() {
                    let input = $(this);
            
                    if ($(input).val() !== '') {
                        $.post({
                            url: '/check-exists',
                            data: {
                                string: $(input).val(),
                                type: value
                            },
                            success: (resp) => {
                                if (resp.status === 'not exist') {
                                    $(input).css(_confirmation('check'));
                                } else {
                                    $(input).css(_confirmation('x'));
                                }
                            }
                        });
                    } else {
                        $(input).removeAttr('style');
                    }
                });
            },
            /**
             * Validates the password as the user types and checks if both password matches
             * @param {String} input The name of the first input
             * @param {String} confirmInput The name of the confirmation input
             */
            password: (input, confirmInput) => {
                var entry = $('#register-form').find('input[name="' + input + '"]');
                var confirm = $('#register-form').find('input[name="' + confirmInput + '"]');
        
                $(entry).on('blur', () => {
                    if ($(entry).val().length >= 6) {
                        if ($(confirm).val().length > 0) {
                            if ($(entry).val() === $(confirm).val()) {
                                $(entry).css(_confirmation('check'));
                                $(confirm).css(_confirmation('check'));
                            } else {
                                $(entry).css(_confirmation('x'));
                                $(confirm).css(_confirmation('x'));
                            }
                        } else {
                            $(entry).css(_confirmation('check'));
                        }
                    } else if ($(entry).val().length > 0 && $(entry).val().length < 6) {
                        if ($(confirm).val().length > 0) {
                            $(entry).css(_confirmation('x'));
                            $(confirm).css(_confirmation('x'));
                        } else {
                            $(entry).css(_confirmation('x'));
                        }
                    } else if ($(entry).val().length === 0) {
                        if ($(confirm).val().length > 0) {
                            $(entry).css(_confirmation('x'));
                            $(confirm).css(_confirmation('x'));
                        } else {
                            $(entry).removeAttr('style');
                            $(confirm).removeAttr('style');
                        }
                    }
                });
        
                $(confirm).on('blur', () => {
                    if ($(entry).val() !== '') {
                        if ($(entry).val().length >= 6) {
                            if ($(entry).val() === $(confirm).val()) {
                                $(entry).css(_confirmation('check'));
                                $(confirm).css(_confirmation('check'));
                            } else {
                                $(entry).css(_confirmation('x'));
                                $(confirm).css(_confirmation('x'));
                            }
                        } else {
                            $(entry).css(_confirmation('x'));
                            $(confirm).css(_confirmation('x'));
                        }
                    } else {
                        if ($(confirm).val() !== '') {
                            $(entry).css(_confirmation('x'));
                            $(confirm).css(_confirmation('x'));
                        } else {
                            $(entry).removeAttr('style');
                            $(confirm).removeAttr('style');
                        }
                    }
                });
            },
            /**
             * Checks both entered email to be valid through regular expression and that they both match
             * @param {String} input The name of the first input
             * @param {String} confirmInput the name of the confirmation input
             */
            email: (input, confirmInput) => {
                var entry = $('#register-form').find('input[name="' + input + '"]');
                var confirm = $('#register-form').find('input[name="' + confirmInput + '"]');
                var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        
                $(entry).on('blur', () => {
                    if (emailPattern.test($(entry).val())) {
                        $(entry).css(_confirmation('check'));
                    } else {
                        $(entry).css(_confirmation('x'));
                    }
                });
        
                $(confirm).on('blur', () => {
                    if (emailPattern.test($(confirm).val())) {
                        if ($(confirm).val() === $(entry).val()) {
                            $(confirm).css(_confirmation('check'));
                        } else {
                            $(confirm).css(_confirmation('x'));
                        }
                    } else {
                        $(confirm).css(_confirmation('x'));
                    }
                });
            }
        },
        clear: () => {
            $('#register-form').find('input[type="text"]').removeAttr('style');
            $('#register-form').find('input[type="email"]').removeAttr('style');
            $('#register-form').find('input[type="password"]').removeAttr('style');
        }
    }
})();

const Fetch = (() => {
    return {
        categories: (callback) => {
            $.get({
                url: '/get-categories',
                success: (resp) => {
                    callback(resp);
                }
            });
        },
        /**
         * @param {String} c Get topics in this category
         */
        topics: function(c, cb) {
            let inputs = Array.from(arguments);
            let category = inputs.find((c) => { return typeof c === 'string'});
            let callback = inputs.find((cb) => { return typeof cb === 'function'});

            $.post({
                url: '/get-topics',
                data: {
                    category: category
                },
                success: (resp) => {
                    callback(resp);
                }
            });
        },
        subtopics: function(t, cb) {
            let inputs = Array.from(arguments);
            let topic = inputs.find((t) => { return typeof t === 'string'});
            let callback = inputs.find((cb) => { return typeof cb === 'function'});

            $.post({
                url: '/get-subtopics',
                data: {
                    topic_id: topic
                },
                success: (resp) => {
                    callback(resp);
                }
            });
        },
        posts: {
            /**
            * @param {String} where Subtopic name
            * @param {String|Number} page Page number use to calculate the offset for database query
            * @param {Boolean} replies If true, fetch for replies only
            * @param {Function} callback Callback with the resp object to create paginations
            */
            count: function(where, page, replies, callback) {
                let args = Array.from(arguments),
                    getReplies = args.find((r) => { return typeof r === 'boolean'});

                $.post({
                    url: '/get-post-count',
                    data: {
                        from: where,
                        page: page,
                        replies: getReplies
                    },
                    success: (resp) => {
                        callback(resp);
                    }
                });
            }
        },
        forums: (callback) => {
            $.get({
                url: '/get-forum-sidebar',
                success: function(resp) {
                    callback(resp);
                }
            });
        }
    }
})();

const Toggle = (() => {
    let _forumSidebar = 'shown';

    return {
        /**
         * @param {String} tabName Name of the tab (eg. this-tab = 'this')
         * @param {String} bodyId ID of the element that holds the content to tab through
         * @param {String} navbarId ID of the element that holds all the tabs
         */
        tabs: (tabName, bodyId, navbarId) => {
            $('#' + tabName + '-tab').on('click', (e) => {
                e.preventDefault();
                
                $(bodyId).children().hide();
                $(navbarId).children().removeClass('active');

                $('#' + tabName + '-tab').addClass('active');
                $('#' + tabName).show();
            });
        },
        /**
        * @param {String} buttonId The button ID
        * @param {String} firstButtonText First text to show
        * @param {String} secondButtonText Second text to show
        */
        button: (buttonId, firstButtonText, secondButtonText) => {
           if ($(buttonId).html() === secondButtonText) {
               $(buttonId).html(firstButtonText);
           } else {
               $(buttonId).html(secondButtonText);
           }
        },
        /**
        * @param {Element} ele The element that contains the data-id and data-status attributes
        * @param {String} searchIn The parent class of ele
        * @param {String} searchFor The class to search for
        */
        badge: (ele, searchIn, searchFor) => {
           let statusBadge = $(ele).parents(searchIn).find(searchFor),
                selectedStatus = $(ele).attr('data-status');
            
            $(statusBadge).empty();

            if (selectedStatus === 'Open') {
                $(statusBadge).append(
                    $('<span>').addClass('user-badge success-badge').text(selectedStatus)
                );
            } else if (selectedStatus === 'Closed') {
                $(statusBadge).append(
                    $('<span>').addClass('user-badge error-badge').text(selectedStatus)
                );
            } else if (selectedStatus === 'Removed') {
                $(statusBadge).append(
                    $('<span>').addClass('user-badge critical-badge').text(selectedStatus)
                );
            } else if (selectedStatus === 'Active') {
                $(statusBadge).append(
                    $('<span>').addClass('user-badge success-badge').text(selectedStatus)
                );
            } else if (selectedStatus === 'Suspended') {
                $(statusBadge).append(
                    $('<span>').addClass('user-badge error-badge').text(selectedStatus)
                );
            } else if (selectedStatus === 'Banned') {
                $(statusBadge).append(
                    $('<span>').addClass('user-badge critical-badge').text(selectedStatus)
                );
            }
        },
        /**
         * Open and closes the menu either by clicking the button or anywhere outside the menu. The parameters should not include . in the class name.
         * @param {String} buttonClass The class name of the button
         * @param {String} menuClass The class name of the menu
         */
        menu: (buttonClass, menuClass) => {
            $('body').on('click', (e) => {
                let button = e.target.className.split(' ').pop();

                if (button === buttonClass) {
                    return;
                } else if ($(e.target).closest('.' + buttonClass).length) {
                    let menu = $(e.target).parent().siblings('.' + menuClass);
        
                    if ($(menu).css('display') === 'block') {
                        $(menu).hide();
                    } else if ($(menu).css('display') === 'none') {
                        $('.' + menuClass).hide();
                        $(menu).show();
                    }
                } else if (e.target.className === menuClass || $(e.target).closest('.' + menuClass).length) {
                    return;
                } else {
                    $('.' + menuClass).hide();
                }
            });
        
            $('.' + buttonClass).on('click', (e) => {
                e.preventDefault();
        
                let menu = $(e.target).next();
        
                if ($(menu).css('display') !== 'none') {
                    $(menu).hide();
                } else if ($(menu).css('display') === 'none') {
                    $('.' + menuClass).hide();
                    $(menu).show();
                }
            });
        },
        sidebar: (toggler, bar, parent, parentWidth, sidebarWidth) => {
            $(toggler).on('click', () => {
                let controlBar = $(bar);
                if (_forumSidebar === 'shown') {
                    $(parent).animate({'left': '-' + sidebarWidth + 'px'}, function() {
                        $(controlBar).children('i').removeClass('fa-angle-double-left').addClass('fa-angle-double-right');
                    });                                
                    $('main').animate({'padding-left': parentWidth - sidebarWidth + 30});
                    _forumSidebar = 'hidden';
                } else {
                    $(parent).animate({'left': '0'}, () => {
                        $(controlBar).children('i').removeClass('fa-angle-double-right').addClass('fa-angle-double-left');
                    });
                    $('main').animate({'padding-left': parentWidth + 30});
                    _forumSidebar = 'shown';
                }
            });
        }
    }
})();