$(document).ready(function() {
    $('.category-title').on('click', function() {
        $(this).siblings('.rename-category').show();
        $(this).siblings('.rename-category').find('input[name=category]').attr('autofocus', 'true');
    });

    $('.cancel-rename-category').on('click', function() {
        $(this).parents('.rename-category').hide();
    });

    $('.rename-category').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        $.post({
            url: '/rename-category',
            data: $(this).serialize(),
            success: function(resp) {
                console.log(resp);
                
                if (resp.status === 'success') {
                    $(form).siblings('.category-title').text(resp.new_title);
                    alertify.success('Renamed');
                    $(form).hide();
                } else if (resp.status === 'not found') {
                    alertify.error('Category not found');
                } else if (resp.status === 'unauthorized') {
                    alertify.error('You\'re not authorized');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            }
        });
    });

    let page = urlParams('page');

    $.post({
        url: '/get-category-count',
        data: {
            page: page
        },
        success: function(resp) {
            if (resp.status === 'success') {
                createPagination('.pagination-container', resp.count, 25, resp.obj, '/admin-page/categories?', false);
            }
        }
    });

    /* $('#change-category-status-form select').on('change', function(e) {
        e.preventDefault();
        let form = $(this).parent();

        showLoading();

        $.post({
            url: '/change-category-status',
            data: $(form).serialize(),
            success: function(resp) {
                hideLoading();

                if (resp.status === 'success') {
                    $(form).parent().siblings('.cat-status').empty();
                    $(form).parent().siblings('.cat-status').append(
                        resp.cat_status === 'Open' ?
                        $('<span>').addClass('user-badge success-badge').html(resp.cat_status) :
                        $('<span>').addClass('user-badge error-badge').html(resp.cat_status)
                    )
                    alertify.success('Category ' + resp.cat_status.toLowerCase());
                } else if (resp.status === 'failed') {
                    alertify.error('Failed to change status');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            }
        });
    }); */

    menuHandler('status-option-button', 'status-option-menu');

    $('.status-option').on('click', function() {
        let option = $(this);
        let status;

        if ($(this).text() === 'Close') {
            status = 'Closed';
        } else {
            status = $(this).text();
        }

        showLoading();

        $.post({
            url: '/change-category-status',
            data: {
                cat_id: $(option).attr('data-cat-id'),
                status: status
            },
            success: function(resp) {
                hideLoading();

                if (resp.status === 'success') {
                    $('.status-option-menu').hide();
                    $(option).parent().parent().parent().siblings('.cat-status').empty();
                    $(option).parent().parent().parent().siblings('.cat-status').append(
                        resp.cat_status === 'Open' ?
                        $('<span>').addClass('user-badge success-badge').html(resp.cat_status) :
                        $('<span>').addClass('user-badge error-badge').html(resp.cat_status)
                    )
                    alertify.success('Category ' + resp.cat_status.toLowerCase());
                } else if (resp.status === 'failed') {
                    alertify.error('Failed to change status');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            }
        })
    })
});