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
});