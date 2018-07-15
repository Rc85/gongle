function createItem(obj, id, form) {
    $('#settings').append(
        $('<div>').addClass('col change-topic-status').append(
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
                            showLoading();

                            $.post({
                                url: '/change-' + id + '-belong-to',
                                data: $(form).serialize(),
                                success: function(resp) {
                                    hideLoading();

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
                            hideLoading();
                        });
                    }
                })
            ),
            $('<div>').addClass('w-15').text(obj.created_by),
            $('<div>').addClass('w-20').text(obj.created_on),
            $('<div>').addClass('w-20 d-flex justify-content-around align-items-start').append(
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
                /* $('<form>').addClass('w-50').attr({'method': 'POST', 'action': '/change-' + id + '-status'}).append(
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
                                hideLoading();
                            })
                        } else if ($(form).val() === 'Delete') {
                            alertify.confirm('Are you sure you want to delete this? This action cannot be reversed.', function(e) {
                                e.preventDefault();
                                showLoading();

                                $(form).parent().submit();
                            }, function() {
                                hideLoading();
                            });
                        } else {
                            $(this).parent().submit();
                        }
                    })
                ).on('submit', function(e) {
                    e.preventDefault();
                    let form = $(this);
                    showLoading();

                    $.post({
                        url: '/change-' + id + '-status',
                        data: $(form).serialize(),
                        success: function(resp) {
                            hideLoading();

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
                }) */
            )
        )
    )

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

    menuHandler('admin-menu-button', 'admin-menu');
}

function handleChangeStatus(form, type) {
    let status = $(form).attr('data-status'),
        id = $(form).attr('data-id');

    showLoading();

    if ($(form).attr('data-status') === 'Removed') {
        alertify.confirm('Are you sure you want to remove this?', function(e) {
            e.preventDefault();

            changeStatus();
        },
        function() {
            hideLoading();
            return false;
        });
    } else if ($(form).attr('data-status') === 'Deleted') {
        alertify.confirm('Are you sure you want to delete this? This action cannot be reversed.', function(e) {
            e.preventDefault();

            changeStatus();
        },
        function() {
            hideLoading();
            return false;
        });
    } else {
        changeStatus();
    }

    function changeStatus() {
        $.post({
            url: '/change-' + type + '-status',
            data: {
                status: status,
                id: id
            },
            success: function(resp) {
                hideLoading();

                if (resp.status === 'success') {
                    if (resp.subtopic_status === 'Open') {
                        $(form).parents('.change-topic-status').find('.user-badge').removeClass().addClass('user-badge success-badge').text(resp.subtopic_status);
                    } else if (resp.subtopic_status === 'Closed') {
                        $(form).parents('.change-topic-status').find('.user-badge').removeClass().addClass('user-badge error-badge').text(resp.subtopic_status);
                    } else if (resp.subtopic_status === 'Removed') {
                        $(form).parents('.change-topic-status').find('.user-badge').removeClass().addClass('user-badge critical-badge').text(resp.subtopic_status);
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

function createTopicForm(id, form) {
    showLoading();

    $.post({
        url: '/create-' + id,
        data: $(form).serialize(),
        success: function(resp) {
            hideLoading();

            if (resp.status === 'success') {
                alertify.success('Created');
                createItem(resp.result, id, form);
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

function getSettings(id, form) {
    showLoading();

    $.post({
        url: '/get-subtopic-details',
        data: $(form).serialize(),
        success: function(resp) {
            hideLoading();
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

                        createTopicForm(id, form);
                    })
                ),
                $('<header>').addClass('header col').append(
                    $('<div>').addClass('w-5').text('ID'),
                    $('<div>').addClass('w-25').text('Name'),
                    $('<div>').addClass('w-15').text('Belongs To'),
                    $('<div>').addClass('w-15').text('Created By'),
                    $('<div>').addClass('w-20').text('Created On'),
                    $('<div>').addClass('w-20').text('Status')
                )
            )

            for (let subtopic of resp.results) {
                if (subtopic.id) {
                    createItem(subtopic, id, form);
                }
            }
        }
    });
}

$(document).ready(function() {
    populateCategoriesSelect();

    $('#select-category').on('change', function() {
        showLoading();

        $.post({
            url: '/get-topics-by-category',
            data: {
                category: $(this).val()
            },
            success: function(resp) {
                hideLoading();

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
    
    $('#get-details-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);
        let data = $(this).serializeArray();

        if (data[1].value !== '') {
            var type = 'subtopic';
        } else {
            var type = 'topic';
        }

        getSettings(type, form);
    });
});