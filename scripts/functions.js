function showLoading() {
    $('body').css({'overflow-y': 'hidden'});

    $('body').prepend(
        $('<div>').addClass('loading-screen').css({'top': $(window).scrollTop()}).append(
            $('<div>').addClass('loading-component').append(
                $('<i>').addClass('fas fa-5x fa-spinner fa-spin'),
                $('<span>').text('Please wait...')
            )
        )
    )
}

function hideLoading() {
    $('body').css({'overflow-y': ''});

    $('.loading-screen').remove();
}

function populateCategoriesSelect() {
    $.get({
        url: '/get-categories',
        success: function(resp) {
            if (resp.status === 'success') {
                for (let i in resp.categories) {
                    $('.select-category').append(
                        $('<option>').attr('value', resp.categories[i].cat_id).text(resp.categories[i].category)
                    )
                }
            }
        }
    });

    $('#select-category').on('change', function() {
        $.post({
            url: '/get-topics-by-category',
            data: {
                category: $(this).val()
            },
            success: function(resp) {
                $('#select-topic').empty();
                $('#select-topic').append($('<option>'));

                if (resp.status === 'success') {
                    for (let i in resp.topics) {
                        $('#select-topic').append(
                            $('<option>').attr('value', resp.topics[i].topic_id).text(resp.topics[i].topic_title)
                        )
                    }
                }
            }
        });
    });
}

function toggleCategories(toBeClicked, toBeToggled) {
    $(toBeClicked).on('click', function() {
        let header = $(this);
        let topicsList = $(header).siblings(toBeToggled);
        $(topicsList).slideToggle(function() {
            if ($(topicsList).css('display') === 'none') {
                $(header).children('i').removeClass('fa-angle-up').addClass('fa-angle-down');
            } else {
                $(header).children('i').removeClass('fa-angle-down').addClass('fa-angle-up');
            }
        });
    });
}

function getPostDetails(form, page, obj) {
    if (form) {
        var data = $(form).serialize() + '&page=' + page;
    } else if (obj) {
        var data = 'category=' + obj.category + '&topic=' + obj.topic + '&subtopic=' + obj.subtopic + '&page=' + page;
    }

    $.post({
        url: '/get-post-details?' + data,
        data: data,
        success: function(resp) {
            console.log(resp);
            hideLoading();

            $('#post-settings').empty();
            $('.pagination-container').empty();

            $('#post-settings').append(
                $('<header>').addClass('header col').append(
                    $('<div>').addClass('w-5').text('ID'),
                    $('<div>').addClass('w-40').text('Post Title'),
                    $('<div>').addClass('w-15').text('Posted By'),
                    $('<div>').addClass('w-25').text('Posted On'),
                    $('<div>').addClass('w-10 text-center').text('Status'),
                    $('<div>').addClass('w-5')
                )
            );

            for (let post in resp.posts) {
                $('#post-settings').append(
                    $('<div>').addClass('admin-post-container').append(
                        adminPostRow(resp.posts[post], false)
                    )
                )
            }

            createPagination('.pagination-container', resp.posts[0].total_posts, 10, resp.obj, false, getPostDetails);
        }
    });
}

/**
 * 
 * @param {Element} appendTo The element, usually a class name, to append the page numbers to.
 * @param {Number} totalItem Total number of items.
 * @param {Number} itemPerPage Items per page.
 * @param {Object} obj Should contain a 'page' variable passed from the server.
 * @param {String|Boolean} link A link for the page numbers to go to.
 * @param {Function|Boolean} func If link is false, a function is required for the page number to execute. If a link is provided, this is false.
 */
function createPagination(appendTo, totalItem, itemPerPage, obj, link, func) {
    let calc = parseInt(totalItem) / itemPerPage; // get number of pages
    let totalNumPages = Math.ceil(calc); // round up the number of pages
    let lowestShownPageNum = parseInt(obj.page) - totalNumPages;
    let pagination = $('<div>').addClass('pagination text-right').append(
        $('<b>').text('Page: ')
    )
    
    if (lowestShownPageNum < 1) {
        lowestShownPageNum = 1;
    }

    if (lowestShownPageNum > 1) {
        var highestShownPageNum = parseInt(obj.page) + totalNumPages / 2;

        if (highestShownPageNum > totalNumPages) {
            highestShownPageNum = totalNumPages;
        }

        createPageNum(pagination, 1, obj, link, 'First', func);
    } else {
        var highestShownPageNum = totalNumPages;
    }

    for (let i = lowestShownPageNum; i <= highestShownPageNum; i++) {
        if (parseInt(obj.page) === i) {
            $(pagination).append(
                $('<span>').addClass('link-div mr-5').html(i)
            )
        } else {
            createPageNum(pagination, i, obj, link, false, func);
        }
    }

    if (totalNumPages > highestShownPageNum) {
        pagination.append('... ');
        createPageNum(pagination, totalNumPages, obj, link, 'Last', func)
    }

/*     if (totalNumPages - parseInt(obj.page) > itemPerPage) {
        createPageNum(pagination, totalNumPages, obj, link)
    } */

    $(appendTo).append(
        $(pagination)
    );
}

function createPageNum(parent, total, obj, link, label, func) {
    if (label) {
        var pageLabel = label;
    } else {
        var pageLabel = total;
    }

    if (link) {
        $(parent).append(
            $('<a>').attr('href', link + '&page=' + total).append(
                $('<span>').addClass('link-div mr-5').html(pageLabel)
            )
        )
    } else {
        $(parent).append(
            $('<a>').attr('href', '#').append(
                $('<span>').addClass('link-div mr-5').html(pageLabel)
            ).on('click', function(e) {
                e.preventDefault();

                func(false, total, obj);
            })
        )
    }
}

function toggleButton(button, buttonLabel) {
    if ($(button).html() === 'Cancel') {
        $(button).html(buttonLabel);
    } else {
        $(button).html('Cancel');
    }
}

function changePostStatus(form, search) {
    let postId = $(form).attr('data-post-id'),
        status = $(form).attr('data-status');
    showLoading();

    $.post({
        url: '/change-post-status',
        data: {
            post_id: postId,
            status: status
        },
        success: function(resp) {
            hideLoading();

            if (resp.status === 'success') {
                let postStatus = $(form).parents(search).find('.post-status');
                console.log(postStatus)
                let successMessage;
                if (resp.post_status === 'Open') {
                    $(postStatus).removeClass('error-badge critical-badge').addClass('success-badge').text('Open');
                    successMessage = 'Post opened';
                } else if (resp.post_status === 'Closed') {
                    $(postStatus).removeClass('success-badge critical-badge').addClass('error-badge').text('Closed');
                    successMessage = 'Post closed';
                } else if (resp.post_status === 'Removed') {
                    $(postStatus).removeClass('success-badge error-badge').addClass('critical-badge').text('Removed');
                    successMessage = 'Post removed';
                }
            
                alertify.success(successMessage);
            } else if (resp.status === 'not found') {
                alertify.error('Post not found');
            } else if (resp.status === 'unauthorized') {
                alertify.error('You\'re not authorized');
            } else if (resp.status === 'error') {
                alertify.error('An error occurred');
            }
        }
    });
}

function changeUserStatus(form, option, search) {
    if (option === 'Active') {
        var confirmString = 'activate';
        var successString = 'User activated';
        var badgeType = 'success-badge';
    } else if (option === 'Banned') {
        var confirmString = 'permanent ban';
        var successString = 'User permanent banned';
        var badgeType = 'error-badge';
    } else if (option === 'Deleted') {
        var confirmString = 'delete';
        var successString = 'User deleted'
        var badgeType = 'critical-badge';
    } else if (option === 'Suspended') {
        var confirmString = 'temporary ban';
        var successString = 'User temporary banned';
        var badgeType = 'warning-badge';
    }

    let currentStatus = $(form).parents(search).find('.user-status').text();

    if (option !== '' && option != currentStatus) {
        alertify
        .okBtn('Yes')
        .cancelBtn('No')
        .confirm('Are you sure you want to ' + confirmString + ' this user?', function(e) {
            e.preventDefault();
            showLoading();

            $.post({
                url: '/change-user-status',
                data: $(form).serialize(),
                success: function(resp) {
                    hideLoading();

                    if (resp.status === 'success') {
                        $(form).parents(search).find('.user-status').removeClass().addClass('user-status user-badge ml-5 mr-5 ' + badgeType).text(option);

                        alertify.success(successString);
                    } else if (resp.status === 'error') {
                        alertify.error('An error occurred');
                    } else if (resp.status === 'not found') {
                        alertify.error('User not found');
                    } else if (resp.status === 'unauthorized') {
                        alertify.error('You\'re not authorized');
                    }
                }
            });
        }, function(e) {
            e.preventDefault();
            hideLoading();
        });
    } else {
        alertify.error('User already ' + option.toLowerCase());
    }
}

function adminPostRow(obj, isInDetails) {
    let content = '';
    
    if (isInDetails) {
        content = $('<div>').addClass('post-content-container').append(
            $('<div>').addClass('post-content').append(
                $('<div>').addClass('post-content-body').append(
                    obj.post_body,
                    (obj.post_modified !== 'Invalid date') ? $('<div>').addClass('text-right mt-15').append(
                        $('<small>').text('Edited on ' + obj.post_modified)) : ''
                )
            )
        )
    }

    let row = $('<div>').addClass('original-post').append(
        $('<div>').addClass('admin-post-row').append(
            $('<div>').addClass('w-5').text(obj.post_id),
            $('<div>').addClass('w-40 admin-post-row-title show-posts').append(
                obj.post_title
            ).on('click', function() {
                if (isInDetails) {
                    $(this).parent().siblings('.post-content').slideToggle();
                } else {
                    window.location.href ='/admin-page/posts/details?pid=' + obj.post_id;
                }
            }),
            $('<div>').addClass('w-15 d-flex').append(
                $('<span>').addClass('mr-5').text(obj.post_user)
            ),
            $('<div>').addClass('w-25').text(obj.post_created),
            $('<div>').addClass('w-10 text-center').append(
                obj.post_status === 'Open' ? $('<span>').addClass('post-status user-badge success-badge').text('Open') : '',
                obj.post_status === 'Closed' ? $('<span>').addClass('post-status user-badge error-badge').text('Closed') : '',
                obj.post_status === 'Removed' ? $('<span>').addClass('post-status user-badge critical-badge').text('Removed') : '',
            ),
            $('<div>').addClass('w-5 text-center').append(
                $('<div>').addClass('admin-menu-container').append(
                    $('<button>').addClass('admin-menu-button').append(
                        $('<i>').addClass('fas fa-lg fa-ellipsis-h')
                    ),
                    $('<div>').addClass('admin-menu text-left').append(
                        /* $('<form>').addClass('open-post').attr({'action': '/change-post-status', 'method': 'POST'}).append(
                            $('<input>').attr({'type': 'hidden', 'name': 'post_id', 'value': obj.post_id}),
                            $('<input>').attr({'type': 'hidden', 'name': 'status', 'value': 'Open'}), */
                            $('<div>').attr({'data-post-id': obj.post_id, 'data-status': 'Open'}).html('Open').on('click', function(e) {
                                e.preventDefault();
                                let form = $(this);
    
                                $(this).parent().on('submit', function(e) {
                                    e.preventDefault();

                                    changePostStatus(form, '.admin-post-row');
                                });

                                $(form).submit();
                                $(form).off('submit');
                            }),
                            //$('<i>').addClass('ml-5 far fa-question-circle').attr('title', 'Makes post visible and accessible')
                        //),
                        obj.belongs_to_post_id === null ?
                        /* $('<form>').addClass('close-post').attr({'action': '/change-post-status', 'method': 'POST'}).append(
                            $('<input>').attr({'type': 'hidden', 'name': 'post_id', 'value': obj.post_id}),
                            $('<input>').attr({'type': 'hidden', 'name': 'status', 'value': 'Closed'}), */
                            $('<div>').attr({'data-post-id': obj.post_id, 'data-status': 'Closed'}).html('Close').on('click', function(e) {
                                e.preventDefault();
                                let form = $(this);
    
                                $(this).parent().on('submit', function(e) {
                                    e.preventDefault();

                                    changePostStatus(form, '.admin-post-row');
                                });

                                $(form).submit();
                                $(form).off('submit');
                            })
                            //$('<i>').addClass('ml-5 far fa-question-circle').attr('title', 'Changes post to read-only')
                        /* ) */ : '',
                        /* $('<form>').addClass('remove-post').attr({'action': '/change-post-status', 'method': 'POST'}).append(
                            $('<input>').attr({'type': 'hidden', 'name': 'post_id', 'value': obj.post_id}),
                            $('<input>').attr({'type': 'hidden', 'name': 'status', 'value': 'Removed'}), */
                            $('<div>').attr({'data-post-id': obj.post_id, 'data-status': 'Removed'}).html('Remove').on('click', function(e) {
                                e.preventDefault();
                                let form = $(this);
    
                                $(this).parent().on('submit', function(e) {
                                    e.preventDefault();

                                    changePostStatus(form, '.admin-post-row');
                                });

                                $(form).submit();
                                $(form).off('submit');
                            }),
                            //$('<i>').addClass('ml-5 far fa-question-circle').attr('title', 'Hides post and makes it inaccessible')
                        //)
                    )
                )
            )
        ),
        content
    )

    return row;
}

function urlParams(p) {
    let urlString = new URL(window.location.href),
        urlParams = new URLSearchParams(urlString.searchParams.toString()),
        param = urlParams.get(p);

    return param;
}

function menuHandler(buttonClass, menuClass) {
    $('body').on('click', function(e) {
        if (e.target.className === buttonClass) {
            return;
            /* let menu = $(e.target).next();
            console.log($(menu).css('display'))

            if ($(menu).css('display') !== 'none') {
                $(menu).hide();
            } else if ($(menu).css('display') === 'none') {
                $('.mod-user-menu').hide();
                $(menu).show();
            } */
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

    $('.' + buttonClass).on('click', function(e) {
        e.preventDefault();

        let menu = $(e.target).next();
        console.log($(menu).css('display'))

        if ($(menu).css('display') !== 'none') {
            $(menu).hide();
        } else if ($(menu).css('display') === 'none') {
            $('.' + menuClass).hide();
            $(menu).show();
        }
    });
}
