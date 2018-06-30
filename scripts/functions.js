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

function changePostStatus(form, option, search) {
    if (option === 'Open') {
        var successMessage = 'Post opened';
    } else if (option === 'Closed') {
        var successMessage = 'Post closed';
    } else if (option === 'Removed') {
        var successMessage = 'Post removed';
    }

    showLoading();
    console.log($(form).parents(search));

    $.post({
        url: '/change-post-status',
        data: $(form).serialize(),
        success: function(resp) {
            hideLoading();

            if (resp.status === 'success') {
                let postStatus = $(form).parents(search).find('.post-status');
                if (resp.post_status === 'Open') {
                    $(postStatus).removeClass('error-badge critical-badge').addClass('success-badge').text('Open');
                } else if (resp.post_status === 'Closed') {
                    $(postStatus).removeClass('success-badge critical-badge').addClass('error-badge').text('Closed');
                } else if (resp.post_status === 'Removed') {
                    $(postStatus).removeClass('success-badge error-badge').addClass('critical-badge').text('Removed');
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
                $('<div>').addClass('mod-user-menu-container').append(
                    $('<button>').addClass('mod-user-button').append(
                        $('<i>').addClass('fas fa-lg fa-ellipsis-h')
                    ),
                    $('<div>').addClass('mod-user-menu text-left').append(
                        $('<form>').addClass('open-post').attr({'action': '/change-post-status', 'method': 'POST'}).append(
                            $('<input>').attr({'type': 'hidden', 'name': 'post_id', 'value': obj.post_id}),
                            $('<input>').attr({'type': 'hidden', 'name': 'status', 'value': 'Open'}),
                            $('<a>').attr({'href': '#'}).html('Open Post').on('click', function(e) {
                                e.preventDefault();
                                let form = $(this).parent();
    
                                $(this).parent().on('submit', function(e) {
                                    e.preventDefault();

                                    changePostStatus(form, $(form).children('input[name=status]').val(), '.admin-post-row');
                                });

                                $(form).submit();
                                $(form).off('submit');
                            }),
                            $('<i>').addClass('ml-5 far fa-question-circle').attr('title', 'Makes post visible and accessible')
                        ),
                        obj.belongs_to_post_id === null ?
                        $('<form>').addClass('close-post').attr({'action': '/change-post-status', 'method': 'POST'}).append(
                            $('<input>').attr({'type': 'hidden', 'name': 'post_id', 'value': obj.post_id}),
                            $('<input>').attr({'type': 'hidden', 'name': 'status', 'value': 'Closed'}),
                            $('<a>').attr({'href': '#'}).html('Close Post').on('click', function(e) {
                                e.preventDefault();
                                let form = $(this).parent();
    
                                $(this).parent().on('submit', function(e) {
                                    e.preventDefault();

                                    changePostStatus(form, $(form).children('input[name=status]').val(), '.admin-post-row');
                                });

                                $(form).submit();
                                $(form).off('submit');
                            }),
                            $('<i>').addClass('ml-5 far fa-question-circle').attr('title', 'Changes post to read-only')
                        ) : '',
                        $('<form>').addClass('remove-post').attr({'action': '/change-post-status', 'method': 'POST'}).append(
                            $('<input>').attr({'type': 'hidden', 'name': 'post_id', 'value': obj.post_id}),
                            $('<input>').attr({'type': 'hidden', 'name': 'status', 'value': 'Removed'}),
                            $('<a>').attr({'href': '#'}).html('Remove Post').on('click', function(e) {
                                e.preventDefault();
                                let form = $(this).parent();
    
                                $(this).parent().on('submit', function(e) {
                                    e.preventDefault();

                                    changePostStatus(form, $(form).children('input[name=status]').val(), '.admin-post-row');
                                });

                                $(form).submit();
                                $(form).off('submit');
                            }),
                            $('<i>').addClass('ml-5 far fa-question-circle').attr('title', 'Hides post and makes it inaccessible')
                        )
                    )
                )
            )
        ),
        content
    )

    return row;
}