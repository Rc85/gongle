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
    let calc = parseInt(totalItem) / itemPerPage, // get number of pages
        totalNumPages = Math.ceil(calc), // round up the number of pages
        lowestShownPageNum = parseInt(obj.page) - totalNumPages,
        highestShownPageNum,
        pagination = $('<div>').addClass('pagination text-right').append(
        $('<b>').addClass('mr-5').text('Page:')
    )
    
    if (lowestShownPageNum < 1) {
        lowestShownPageNum = 1;
    }
    
    if (lowestShownPageNum > 1) {
        highestShownPageNum = parseInt(obj.page) + totalNumPages / 2;

        if (highestShownPageNum > totalNumPages) {
            highestShownPageNum = totalNumPages;
        }

        createPageNum(pagination, 1, obj, link, 'First', func);
    } else {
        highestShownPageNum = totalNumPages;
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
    let pageLabel;

    if (label) {
        pageLabel = label;
    } else {
        pageLabel = total;
    }

    if (link) {
        $(parent).append(
            $('<a>').addClass('link-div mr-5').attr('href', link + '&page=' + total).append(
                $('<span>').html(pageLabel)
            )
        )
    } else {
        $(parent).append(
            $('<a>').addClass('link-div mr-5').attr('href', '#').append(
                $('<span>').html(pageLabel)
            ).on('click', function(e) {
                e.preventDefault();

                func(false, total, obj);
            })
        )
    }
}

/* function handleTabClick(tabName, bodyId, navbarId) {
    $('#' + tabName + '-tab').on('click', function(e) {
        e.preventDefault();
        
        $(bodyId).children().hide();
        $(navbarId).children().removeClass('active');

        $('#' + tabName + '-tab').addClass('active');
        $('#' + tabName).show();
    });
} */

/* function toggleButton(buttonId, firstButtonText, secondButtonText) {
    if ($(buttonId).html() === secondButtonText) {
        $(buttonId).html(firstButtonText);
    } else {
        $(buttonId).html(secondButtonText);
    }
} */

/* function changePostStatus(form, search) {
    let postId = $(form).attr('data-id'),
        status = $(form).attr('data-status');
    App.loading.show();

    $.post({
        url: '/change-post-status',
        data: {
            post_id: postId,
            status: status
        },
        success: function(resp) {
            App.loading.hide();

            if (resp.status === 'success') {
                let postStatus = $(form).parents(search).find('.post-status'),
                    successMessage;
                
                $(postStatus).empty();

                if (resp.post_status === 'Open') {
                    $(postStatus).append(
                        $('<span>').addClass('user-badge success-badge').text(resp.post_status)
                    );
                    successMessage = 'Post opened';
                } else if (resp.post_status === 'Closed') {
                    $(postStatus).append(
                        $('<span>').addClass('user-badge error-badge').text(resp.post_status)
                    )
                    successMessage = 'Post closed';
                } else if (resp.post_status === 'Removed') {
                    $(postStatus).append(
                        $('<span>').addClass('user-badge critical-badge').text(resp.post_status)
                    )
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
} */

/* function changeCategoryStatus(option, searchIn) {
    let catId = $(option).attr('data-id');
    let status = $(option).attr('data-status');
    console.log(catId)
    
    App.loading.show();

    $.post({
        url: '/change-category-status',
        data: {
            cat_id: catId,
            status: status
        },
        success: function(resp) {
            App.loading.hide();

            if (resp.status === 'success') {
                $('.status-option-menu').hide();
                $(option).parent().parent().parent().siblings('.cat-status').empty();
                $(option).parent().parent().parent().siblings('.cat-status').append(
                    resp.category_status === 'Open' ?
                    $('<span>').addClass('user-badge success-badge').html(resp.category_status) :
                    $('<span>').addClass('user-badge error-badge').html(resp.category_status)
                )
                alertify.success('Category ' + resp.category_status.toLowerCase());
            } else if (resp.status === 'failed') {
                alertify.error('Failed to change status');
            } else if (resp.status === 'error') {
                alertify.error('An error occurred');
            } else if (resp.status === 'deleted') {
                $(option).parents(searchIn).remove();
                alertify.success('Deleted')
            }
        }
    });
} */

/* function changeUserStatus(form, option, search) {
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
            App.loading.show();

            $.post({
                url: '/change-user-status',
                data: $(form).serialize(),
                success: function(resp) {
                    App.loading.hide();

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
            App.loading.hide();
        });
    } else {
        alertify.error('User already ' + option.toLowerCase());
    }
} */

/* function adminPostRow(obj, isInDetails) {
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
                            $('<div>').attr({'data-id': obj.post_id, 'data-status': 'Open'}).html('Open').on('click', function(e) {
                                e.preventDefault();
                                let form = $(this);
    
                                $(this).parent().on('submit', function(e) {
                                    e.preventDefault();

                                    changePostStatus(form, '.admin-post-row');
                                });

                                $(form).submit();
                                $(form).off('submit');
                            }),
                        obj.belongs_to_post_id === null ?
                        $('<div>').attr({'data-id': obj.post_id, 'data-status': 'Closed'}).html('Close').on('click', function(e) {
                            e.preventDefault();
                            let form = $(this);

                            $(this).parent().on('submit', function(e) {
                                e.preventDefault();

                                changePostStatus(form, '.admin-post-row');
                            });

                            $(form).submit();
                            $(form).off('submit');
                        }) : '',
                        $('<div>').attr({'data-id': obj.post_id, 'data-status': 'Removed'}).html('Remove').on('click', function(e) {
                            e.preventDefault();
                            let form = $(this);

                            $(this).parent().on('submit', function(e) {
                                e.preventDefault();

                                changePostStatus(form, '.admin-post-row');
                            });

                            $(form).submit();
                            $(form).off('submit');
                        }),
                    )
                )
            )
        ),
        content
    )

    return row;
} */

/* function urlParams(p) {
    let urlString = new URL(window.location.href),
        urlParams = new URLSearchParams(urlString.searchParams.toString()),
        param = urlParams.get(p);

    return param;
} */

/* function menuHandler(buttonClass, menuClass) {
    $('body').on('click', function(e) {
        if (e.target.className === buttonClass) {
            return;
            let menu = $(e.target).next();
            console.log($(menu).css('display'))

            if ($(menu).css('display') !== 'none') {
                $(menu).hide();
            } else if ($(menu).css('display') === 'none') {
                $('.mod-user-menu').hide();
                $(menu).show();
            }
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
} */

function DeleteAllItems(itemList, url) {
    $.post({
        url: url,
        data: {
            items: itemList
        },
        success: function(resp) {
            if (resp.status === 'success') {
                location.reload();
            } else {
                alertify.error('An error occurred');
            }
        }
    });
}

/* function createItem(obj, id, form, cb) {
    $('#settings').append(
        $('<div>').addClass('col change-topic-status').append(
            $('<div>').addClass('w-5').append(
                $('<input>').addClass('select-item').attr({'value': obj.id, 'type': 'checkbox'}).on('click', function() {
                    cb($(this).attr('value'));
                })
            ),
            $('<div>').addClass('w-5').text(obj.id),
            $('<div>').addClass('w-25').append(
                $('<span>').addClass('subtopic-title').attr('data-belongs-to', obj.topic_id).text(obj.title).on('click', function() {
                    let parent = $(this).parent();
                    let title = $(this);

                    $(title).empty();
                    let form = $('<form>').addClass('d-flex justify-content-around').attr({'method': 'POST', 'action': '/rename-' + id}).append(
                        $('<input>').attr({'type': 'hidden', 'name': 'id', 'value': obj.id}),
                        $('<input>').attr({'type': 'text', 'name': 'new_title', 'autofocus': 'true'}).css({'flex': '0.60'}),
                        $('<input>').attr({'type': 'submit', 'value': 'Submit'}).css({'display': 'none'}),
                        $('<input>').attr({'type': 'button', 'value': 'Cancel'}).css({'flex': '0.25'}).on('click', function() {
                            $(title).text(obj.title);
                            $(form).remove();
                        })
                    ).on('submit', function(e) {
                        e.preventDefault();
                        let form = $(this);
                        
                        $.post({
                            url: '/rename-' + id,
                            data: $(form).serialize(),
                            success: function(resp) {
                                if (resp.status === 'success') {
                                    $(form).remove();
                                    $(title).html(resp.new_title);
                                    alertify.success('Renamed');
                                } else {
                                    alertify.error('An error occurred');
                                }
                            }
                        });
                    });
                    
                    $(parent).append(form);
                })
            ),
            $('<div>').addClass('w-15').append(
                $('<form>').attr({'method': 'POST', 'action': '/change-' + id + '-belong-to'}).append(
                    $('<input>').attr({'type': 'hidden', 'name': 'id', 'value': obj.id}),
                    $('<select>').attr({'name': 'topic_id'}).addClass('topic-select').append(
                        $('<option>')
                    ).on('change', function() {
                        $(this).parent().submit();
                    })
                ).on('submit', function(e) {
                    e.preventDefault();
                    let form = $(this);

                    if ($(form).children('select').val() !== '') {
                        alertify
                        .okBtn('Yes')
                        .cancelBtn('No')
                        .confirm('Are you sure you want to change the category of this topic?', function(e) {
                            e.preventDefault();
                            App.loading.show();

                            $.post({
                                url: '/change-' + id + '-belong-to',
                                data: $(form).serialize(),
                                success: function(resp) {
                                    App.loading.hide();

                                    if (resp.status === 'success') {
                                        alertify.success('Category changed');
                                        $(title).attr('data-belongs-to', resp.topic_id);
                                    } else {
                                        alertify.error('An error occurred');
                                    }
                                }
                            });
                        }, function(e) {
                            e.preventDefault();
                            App.loading.hide();
                        });
                    }
                })
            ),
            $('<div>').addClass('w-15').text(obj.created_by),
            $('<div>').addClass('w-20').text(obj.created_on),
            $('<div>').addClass('w-15 d-flex justify-content-around align-items-start').append(
                obj.status === 'Open' ? $('<span>').addClass('user-badge success-badge').text(obj.status) : '',
                obj.status === 'Closed' ? $('<span>').addClass('user-badge error-badge').text(obj.status) : '',
                obj.status === 'Removed' ? $('<span>').addClass('user-badge critical-badge').text(obj.status) : '',
                $('<div>').addClass('admin-menu-container').append(
                    $('<i>').addClass('admin-menu-button fas fa-lg fa-ellipsis-h'),
                    $('<div>').addClass('admin-menu').append(
                        $('<div>').html('Open').attr({'data-id': obj.id, 'data-status': 'Open'}).on('click', function() {
                            handleChangeStatus($(this), id);
                        }),
                        $('<div>').html('Close').attr({'data-id': obj.id, 'data-status': 'Closed'}).on('click', function() {
                            handleChangeStatus($(this), id);
                        }),
                        $('<div>').html('Remove').attr({'data-id': obj.id, 'data-status': 'Removed'}).on('click', function() {
                            handleChangeStatus($(this), id);
                        }),
                        $('<div>').html('Delete').attr({'data-id': obj.id, 'data-status': 'Deleted'}).on('click', function() {
                            handleChangeStatus($(this), id);
                        })
                    )
                )
                $('<form>').addClass('w-50').attr({'method': 'POST', 'action': '/change-' + id + '-status'}).append(
                    $('<input>').attr({'type': 'hidden', 'name': 'id', 'value': obj.id}),
                    $('<select>').addClass('w-100').attr({'name': 'status'}).append(
                        $('<option>'),
                        $('<option>').attr('value', 'Open').text('Open'),
                        $('<option>').attr('value', 'Closed').text('Close'),
                        $('<option>').attr('value', 'Removed').text('Remove'),
                        $('<option>').attr('value', 'Delete').text('Delete')
                    ).on('change', function() {
                        let form = $(this);

                        if ($(form).val() === 'Removed') {
                            alertify.confirm('Are you sure you want to remove this?', function(e) {
                                e.preventDefault();

                                $(form).parent().submit();
                            }, function() {
                                App.loading.hide();
                            })
                        } else if ($(form).val() === 'Delete') {
                            alertify.confirm('Are you sure you want to delete this? This action cannot be reversed.', function(e) {
                                e.preventDefault();
                                App.loading.show();

                                $(form).parent().submit();
                            }, function() {
                                App.loading.hide();
                            });
                        } else {
                            $(this).parent().submit();
                        }
                    })
                ).on('submit', function(e) {
                    e.preventDefault();
                    let form = $(this);
                    App.loading.show();

                    $.post({
                        url: '/change-' + id + '-status',
                        data: $(form).serialize(),
                        success: function(resp) {
                            App.loading.hide();

                            if (resp.status === 'success') {
                                $(form).children('select').prop('selectedIndex', 0);

                                if (resp.subtopic_status === 'Open') {
                                    $(form).siblings('.user-badge').removeClass().addClass('user-badge success-badge').text(resp.subtopic_status);
                                } else if (resp.subtopic_status === 'Closed') {
                                    $(form).siblings('.user-badge').removeClass().addClass('user-badge error-badge').text(resp.subtopic_status);
                                } else if (resp.subtopic_status === 'Removed') {
                                    $(form).siblings('.user-badge').removeClass().addClass('user-badge critical-badge').text(resp.subtopic_status);
                                }
                                
                                alertify.success('Successful');
                            } else if (resp.status === 'deleted') {
                                $(form).parent().parent().remove();
                                alertify.success('Deleted');
                            } else {
                                alertify.error('An error occurred');
                            }
                        }
                    });
                })
            )
        )
    )

    menuHandler('admin-menu-button', 'admin-menu');

    $.post({
        url: '/get-belongs-to',
        data: $('#get-details-form').serialize(),
        success: function(resp) {
            $('.topic-select').empty();

            for (let topic of resp.topics) {
                $('.topic-select').append(
                    $('<option>').attr('value', topic.id).text(topic.title)
                )
            }

            $('.topic-select').val(resp.id);
        }
    });
} */

/* function handleChangeStatus(form, type) {
    let status = $(form).attr('data-status'),
        id = $(form).attr('data-id');

    if ($(form).attr('data-status') === 'Removed') {
        alertify.confirm('Are you sure you want to remove this?', function(e) {
            e.preventDefault();

            changeStatus();
        },
        function() {
            App.loading.hide();
            return false;
        });
    } else if ($(form).attr('data-status') === 'Deleted') {
        alertify.confirm('Are you sure you want to delete this? This action cannot be reversed.', function(e) {
            e.preventDefault();

            changeStatus();
        },
        function() {
            App.loading.hide();
            return false;
        });
    } else {
        changeStatus();
    }

    function changeStatus() {
        App.loading.show();

        $.post({
            url: '/change-' + type + '-status',
            data: {
                status: status,
                id: id
            },
            success: function(resp) {
                App.loading.hide();

                if (resp.status === 'success') {
                    if (resp.subtopic_status === 'Open') {
                        $(form).parents('.admin-topic-row').find('.user-badge').removeClass().addClass('user-badge success-badge').text(resp.subtopic_status);
                    } else if (resp.subtopic_status === 'Closed') {
                        $(form).parents('.admin-topic-row').find('.user-badge').removeClass().addClass('user-badge error-badge').text(resp.subtopic_status);
                    } else if (resp.subtopic_status === 'Removed') {
                        $(form).parents('.admin-topic-row').find('.user-badge').removeClass().addClass('user-badge critical-badge').text(resp.subtopic_status);
                    }
                    
                    alertify.success('Successful');
                } else if (resp.status === 'deleted') {
                    $(form).parents('.change-topic-status').remove();
                    alertify.success('Deleted');
                } else {
                    alertify.error('An error occurred');
                }
            }
        });
    }
}

function createTopicForm(id, form, cb) {
    App.loading.show();

    $.post({
        url: '/create-' + id,
        data: $(form).serialize(),
        success: function(resp) {
            App.loading.hide();

            if (resp.status === 'success') {
                alertify.success('Created');
                createItem(resp.result, id, form, function(id) {
                    cb(id);
                });
                if (id === 'topic') {
                    $('#select-topic').append(
                        $('<option>').attr('value', resp.result.id).text(resp.result.title)
                    )
                }

                $(form).find('input[name=title]').val('');
            } else {
                alertify.error('An error occurred');
            }
        }
    });
}

function getSettings(id, form, cb) {
    App.loading.show();

    $.post({
        url: '/get-subtopic-details',
        data: $(form).serialize(),
        success: function(resp) {
            App.loading.hide();
            console.log(resp);

            $('#settings').empty();

            $('#settings').append(
                $('<div>').append(
                    $('<h3>').text('Create'),
                    $('<div>').addClass('mb-15').html((id === 'subtopic' ? $('#select-category option:selected').text() + ' <i class="fas fa-angle-right"></i> ' : resp.results[0].parent_title) + $('#select-topic option:selected').text()),
                    $('<form>').attr({'action': '/create-' + id, 'method': 'POST', 'id': 'create-' + id + '-form'}).append(
                        $('<input>').attr({'type': 'hidden', 'value': resp.results[0].parent_id, 'name': 'parent'}),
                        $('<div>').addClass('d-flex mb-15 justify-content-between align-items-center').append(
                            $('<label>').text('Name: '),
                            $('<input>').addClass('w-95').attr({'type': 'text', 'name': 'title'})
                        ),
                        $('<div>').addClass('text-right').append(
                            $('<input>').attr({'type': 'submit', 'value': 'Create'})
                        )
                    ).on('submit', function(e) {
                        e.preventDefault();
                        let form = $(this);

                        createTopicForm(id, form, function(id) {
                            cb(id);
                        });
                    })
                ),
                $('<div>').addClass('mt-15 text-right').append(
                    $('<button>').html('Delete').on('click', function() {
                        cb($(this));
                    })
                ),
                $('<header>').addClass('header col').append(
                    $('<div>').addClass('w-5').append(
                        $('<input>').addClass('select-all').attr('type', 'checkbox').on('click', function() {
                            if ($(this).prop('checked')) {
                                $('.select-item').each(function(i, item) {
                                    $(item).prop('checked', 'true');
                                    cb($(this).attr('value'));
                                });
                            }
                        })
                    ),
                    $('<div>').addClass('w-5').text('ID'),
                    $('<div>').addClass('w-25').css('position', 'relative').append(
                        $('<div>').addClass('tooltip').html('Click a title to rename'),
                        $('<i>').addClass('far fa-question-circle mr-5 tooltip-button').on('mouseover', function() {
                            $(this).siblings('.tooltip').show();
                        }).on('mouseout', function() {
                            $(this).siblings('.tooltip').hide()
                        }),
                        'Title'
                    ),
                    $('<div>').addClass('w-15').text('Belongs To'),
                    $('<div>').addClass('w-15').text('Created By'),
                    $('<div>').addClass('w-20').text('Created On'),
                    $('<div>').addClass('w-15').text('Status')
                )
            )

            for (let subtopic of resp.results) {
                if (subtopic.id) {
                    createItem(subtopic, id, form, function(id) {
                        cb(id);
                    });
                }
            }
        }
    });
} */

/* function submitPost(data) {
    $.post({
        url: '/post',
        data: data,
        success: function(resp) {
            if (resp.status === 'success') {
                location.reload();
            } else if (resp.status === 'error') {
                alertify.error('An error occurred');
            } else if (resp.status === 'failed') {
                alertify.error('Failed to post');
            } else if (resp.status === 'user not found') {
                alertify.error('Are you logged in?');
            } else if (resp.status === 'banned') {
                alertify.error('Your account is banned');
            } else if (resp.status == 'invalid post') {
                alertify.error('Cannot submit blank post')
            }
        }
    });
} */

/* function getNumberOfPosts(where, page, callback) {
    $.post({
        url: '/get-num-of-posts',
        data: {
            from: where,
            page: page
        },
        success: function(resp) {
            callback(resp);
        }
    });
}
function getNumberOfReplies(postId, page, callback) {
    $.post({
        url: '/get-replies',
        data: {
            post_id: postId,
            page: page
        },
        success: function(resp) {
            if (resp.status === 'success') {
                callback(resp);
            }
        }
    });
} */

/* function toggleSidebar(toggler, bar, sidebarParent, parentWidth, sidebarWidth, callback) {
    $(toggler).on('click', function() {
        let controlBar = $(bar);
        if (forumSidebar === 'shown') {
            $(sidebarParent).animate({'left': '-' + sidebarWidth + 'px'}, function() {
                $(controlBar).children('i').removeClass('fa-angle-double-left').addClass('fa-angle-double-right');
            });                                
            $('main').animate({'padding-left': parentWidth - sidebarWidth + 30});
            callback('hidden')
        } else {
            $(sidebarParent).animate({'left': '0'}, function() {
                $(controlBar).children('i').removeClass('fa-angle-double-right').addClass('fa-angle-double-left');
            });
            $('main').animate({'padding-left': parentWidth + 30});
            callback('shown');
        }
    });
} */