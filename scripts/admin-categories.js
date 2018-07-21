$(document).ready(function() {
    $('.category-title').on('click', function() {
        $(this).siblings('.rename-category').show();
        $(this).siblings('.rename-category').find('input[name=category]').attr('autofocus', 'true');
    });

    $('.cancel-rename-category').on('click', function() {
        $(this).parents('.rename-category').attr('autofocus', 'false');
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

    let page = App.url.param('page');

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

        App.loading.show();

        $.post({
            url: '/change-category-status',
            data: $(form).serialize(),
            success: function(resp) {
                App.loading.hide();

                if (resp.status === 'success') {
                    $(form).parent().siblings('.cat-status').empty();
                    $(form).parent().siblings('.cat-status').append(
                        resp.category_status === 'Open' ?
                        $('<span>').addClass('user-badge success-badge').html(resp.category_status) :
                        $('<span>').addClass('user-badge error-badge').html(resp.category_status)
                    )
                    alertify.success('Category ' + resp.category_status.toLowerCase());
                } else if (resp.status === 'failed') {
                    alertify.error('Failed to change status');
                } else if (resp.status === 'error') {
                    alertify.error('An error occurred');
                }
            }
        });
    }); */

    $('.admin-menu div').on('click', function() {
        let option = $(this);

        Admin.status.change(option, 'categories', (status) => {
            $('.admin-menu').hide();

            App.handle.response(status, () => {
                Toggle.badge(option, '.category-row', '.cat-status');
            });
        });

        /* if ($(this).attr('data-status') === 'Delete') {
            alertify.confirm('Are you sure you want delete this category? This cannot be reversed.', function(e) {
                e.preventDefault();

                changeCategoryStatus(option, '.category-row');
            },
            function(e) {
                App.loading.hide();
                return false;
            });
        } else {
            changeCategoryStatus(option, '.category-row');
        } */
    });

    let categories = [];

    $('#select-all').on('click', function() {
        if ($(this).prop('checked')) {
            $('.select-item').prop('checked', true);
            $('.select-item').each(function(i) {
                categories.push($(this).attr('data-id'));
            });

            console.log(categories);
        } else {
            $('.select-item').prop('checked', false);
        }
    });

    $('.select-item').on('click', function() {
        if ($(this).prop('checked')) {
            categories.push($(this).attr('data-id'));
        } else {
            categories.splice(categories.indexOf($(this).attr('data-id')), 1);
        }

        console.log(categories);
    });

    $('.delete-button').on('click', function() {
        alertify.confirm('Are you sure you want to delete the selected categories? This cannot be reversed.', function(e) {
            e.preventDefault();

            App.loading.show();

            $.post({
                url: '/delete-all',
                data: {
                    type: 'categories',
                    ids: categories
                },
                success: function(resp) {
                    console.log(resp);
                    App.loading.hide();

                    if (resp.status === 'success') {
                        location.reload();
                    } else if (resp.status === 'error') {
                        alertify.error('An error occurred');
                    } else if (resp.status === 'failed') {
                        alertify.error('Failed to delete');
                    }
                }
            });
        });
    });
});