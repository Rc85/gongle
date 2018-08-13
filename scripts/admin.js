$(document).ready(function() {
    Toggle.menu('admin-menu-button', 'admin-menu');

    $('.reviewed-button').on('click', function(e) {
        let id = $(this).attr('data-id');

        location.href = `/admin-page/review/report?id=${id}`;
    });

    $('#review-report-form').on('submit', function(e) {
        e.preventDefault();
        let form = $(this);
        let data = $(form).serializeArray();
        let message = $(form).find('.ql-editor').html();
        data.push({message: message});

        Admin.report.review(data, (resp) => {
            App.handle.response(resp, () => {
                location.href = '/admin-page/reports';
            });
        });
    });

    $('.review-detail-button').on('click', function(e) {
        $(this).parents('.report-row').find('.review-detail').slideToggle();
    });
});