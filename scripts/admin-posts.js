$(document).ready(function() {
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

    $('#select-topic').on('change', function() {
        let topic = $(this).val();

        Fetch.subtopics(topic, (resp) => {
            $('#select-subtopic').empty();
            $('#select-subtopic').append($('<option>'));

            for (let subtopic of resp.subtopics) {
                $('#select-subtopic').append(
                    $('<option>').attr('value', subtopic.subtopic_id).text(subtopic.subtopic_title)
                )
            }
        });
    });

    $('.admin-menu div').on('click', function() {
        let option = $(this);

        Admin.status.change(option, 'posts', function(resp) {
            $('.admin-menu').hide();
            
            App.handle.response(resp, function() {
                alertify.success('Post status updated');
                Toggle.badge(option, '.admin-post-row', '.post-status');
            });
        });
    });
});