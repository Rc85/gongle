$(document).ready(function() {
    $('.category-title').on('click', function() {
        $(this).siblings('.rename-category').show();
        $(this).siblings('.rename-category').find('input[name=category]').focus();
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

    $('.admin-menu div').on('click', function(e) {
        let option = $(this);
        let id = $(option).attr('data-id');
        let status = $(option).attr('data-status');

        if (status === 'Delete') {
            alertify
            .okBtn('Yes')
            .cancelBtn('No')
            .confirm('Are you sure you want to delete this category? This cannot be reversed.', (e) => {
                e.preventDefault();
            
                Admin.forum.delete(id, 'categories', (resp) => {
                    $('.admin-menu').hide();

                    App.handle.response(resp, () => {
                        alertify.success('Category deleted');
                        $(option).parents('.category-row').remove();
                    });
                });
            }, () => {
                App.loading.hide();
                return false;
            });
        } else {
            Admin.status.change(option, 'categories', (resp) => {
                $('.admin-menu').hide();

                App.handle.response(resp, () => {
                    alertify.success('Category status updated');
                    Toggle.badge(option, '.category-row', '.cat-status');
                });
            });
        }
        
        /* if (status !== 'Delete') {
            console.log(status);
            Admin.status.change(option, 'categories', (resp) => {
                $('.admin-menu').hide();

                App.handle.response(resp, () => {
                    alertify.success('Category status updated');
                    Toggle.badge(option, '.category-row', '.cat-status');
                });
            });
        } else {
            console.log(status);
            Admin.forum.delete(option, 'categories', (resp) => {
                $('.admin-menu').hide();

                App.handle.response(resp, () => {
                    alertify.success('Category deleted');
                    $(option).parents('.category-row').remove();
                });
            });
        } */
    });

    let categories = [];

    $('#select-all').on('click', function() {
        if ($(this).prop('checked')) {
            $('.select-item').prop('checked', true);
            categories = [];
            $('.select-item').each(function(i) {
                categories.push($(this).attr('data-id'));
            });
        } else {
            $('.select-item').prop('checked', false);

            categories = [];
        }
    });

    $('.select-item').on('click', function() {
        if ($(this).prop('checked')) {
            categories.push($(this).attr('data-id'));
        } else {
            categories.splice(categories.indexOf($(this).attr('data-id')), 1);
        }
    });

    $('.delete-button').on('click', function() {
        alertify.confirm('Are you sure you want to delete the selected categories? This cannot be reversed.', function(e) {
            e.preventDefault();

            App.loading.show();

            Admin.forum.delete(categories, 'categories', (resp) => {
                App.handle.response(resp, () => {
                    location.reload();
                });
            });
        });
    });

    $('#create-category-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        Admin.forum.create(form, (resp) => {
            App.handle.response(resp, () => {
                location.reload();
            });
        });
    });
});