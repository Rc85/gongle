$(document).ready(function() {
    let id = [];

    Fetch.categories((resp) => {
        for (let category of resp.categories) {
            $('#select-category').append(
                $('<option>').attr('value', category.category_id).text(category.category)
            )
        }
    });

    $('#select-category').on('change', function() {
        let category = $(this).val();

        Fetch.topics(category, (resp) => {
            $('#select-topic').empty();
            $('#select-topic').append($('<option>'));
            
            for (let topic of resp.topics) {
                $('#select-topic').append(
                    $('<option>').attr('value', topic.topic_id).text(topic.topic_title)
                )
            }
        });
    });

    $('.belongs-to').on('change', function() {
        let dest = $(this).val();
        let type = $(this).attr('data-type');
        let item = $(this).attr('data-item');

        Admin.forum.move(item, dest, type, (resp) => {
            alertify.success('Moved successfully');
            App.handle.response(resp);
        });
    });

    $('.admin-menu div').on('click', function() {
        let option = $(this);
        let type = $(option).attr('data-type');

        if ($(option).attr('data-status') !== 'Delete') {
            Admin.status.change(option, type, (resp) => {
                App.handle.response(resp, () => {
                    Toggle.badge(option, '.admin-topic-row', '.admin-topic-status');
                });
            });
        } else {
            let id = $(option).attr('data-id');

            Admin.forum.delete([id], type, (resp) => {
                App.handle.response(resp, () => {
                    alertify.success('Forum deleted');
                    $(option).parents('.admin-topic-row').remove();
                });
            });
        }

        $('.admin-menu').hide();
    });

    $('#select-all').on('click', function() {
        if ($(this).prop('checked')) {
            $('.select-item').prop('checked', true);
            id = [];

            $('.select-item').each(function(i) {
                id.push($(this).attr('data-id'));
            });
        } else {
            $('.select-item').prop('checked', false);
            id = [];
        }
    });

    $('.select-item').on('click', function() {
        if ($(this).prop('checked')) {
            id.push($(this).attr('data-id'));
        } else {
            id.splice(id.indexOf($(this).attr('data-id')), 1);
        }
    });

    $('#delete-all').on('click', function() {
        let type = $(this).attr('data-type');

        alertify
        .okBtn('Yes')
        .cancelBtn('No')
        .confirm('Are you sure you want to delete the selected forum(s)? This cannot be reversed.', (e) => {
            e.preventDefault();

            Admin.forum.delete(id, type, (resp) => {
                location.reload();
            });
        },
        function() {
            return false;
        });
    });

    $('.create-topic-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        Admin.forum.create(form, (resp) => {
            App.handle.response(resp, () => {
                location.reload();
            });
        });
    });

    $('.admin-topic-title').on('click', function() {
        let form = $(this).children('.admin-rename-topic-form');
        let input = $(form).children('.admin-rename-topic-title');
        $(form).show();
        $(input).focus();
        
        $(form).children('.admin-rename-topic-cancel').on('click', function(e) {
            e.stopPropagation();

            $(form).hide();
        });
    });

    $('.admin-rename-topic-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);

        Admin.forum.rename(form, (resp) => {
            App.handle.response(resp, (resp) => {
                alertify.success('Forum renamed');
                $(form).parents('.admin-topic-row').find('.admin-topic-title div').text(resp.title);
                $(form).hide();
            });
        });
    });
});