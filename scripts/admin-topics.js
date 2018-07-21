$(document).ready(function() {
    populateSelect('.select-category');

    $('#select-category').on('change', function() {
        App.loading.show();

        $.post({
            url: '/get-topics-by-category',
            data: {
                category: $(this).val()
            },
            success: function(resp) {
                App.loading.hide();

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

    $('.admin-menu div').on('click', function() {
        handleChangeStatus($(this), $(this).attr('data-type'));
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

        let idArray = [];

        getSettings(type, form, function() {
            console.log(arguments);
            let args = Array.from(arguments);
            let id = args.filter(function(a) { return typeof a === 'string'});
            let button = args.filter(function(b) { return typeof b === 'object' });

            idArray.push(id);
            console.log(idArray);

            $(button).on('click', function() {
                console.log('hi')
            })
        });
    });
});