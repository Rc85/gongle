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
             * @param {String} status The response from server
             */
            response: (status, callback) => {
                if (status === 'success') {
                    alertify.success('Updated');
                    callback();
                } else if (status === 'not found') {
                    alertify.error('Not found');
                } else if (status === 'unauthorized') {
                    alertify.error('You\'re not authorized');
                } else if (status === 'error') {
                    alertify.error('An error occurred');
                } else if (status === 'fail') {
                    alertify.error === 'Failed to execute that action';
                } else if (status === 'deleted') {
                    alertify.success('Deleted');
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
                    if (resp.status === 'success') {
                        callback(resp.categories);
                    } else if (resp.status === 'error') {
                        alertify.alert('An error occurred')
                    } else if (resp.status === 'failed') {
                        alertify.alert('Failed to fetch categories');
                    }
                }
            });
        },
        /**
         * @param {String} c Get topics in this category
         */
        topics: (c, cb) => {
            let inputs = Array.from(arguments);
            let category = inputs.find((c) => { return typeof c === 'string'});
            let callback = inputs.find((cb) => { return typeof cb === 'function'});

            $.post({
                url: '/get-topics',
                data: {
                    category: category
                },
                success: (resp) => {
                    if (resp.status === 'success') {
                        callback(resp.topics)
                    } else if (resp.status === 'fail') {
                        alertify.error('Failed to fetch topics');
                    } else if (resp.status === 'error') {
                        alertify.error('An error occurred');
                    }
                }
            });
        },
        posts: {
            /**
            * @param {String} where Subtopic name
            * @param {String|Number} page Page number use to calculate the offset for database query
            * @param {Function} callback 
            */
            count: (where, page, callback) => {
               $.post({
                   url: '/get-post-count',
                   data: {
                       from: where,
                       page: page
                   },
                   success: (resp) => {
                       callback(resp);
                   }
               });
           }
        }
    }
})();

const Toggle = (() => {
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
        }
    }
})();