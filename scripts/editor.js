$(document).ready(function() {
    $('.post-editor').each(function(i, editor) {
        var quill = new Quill(editor, {
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'color': [] }],
                    [{ 'align': [] }],
    
                    ['clean']       
                ]
            },
            theme: 'snow'
        });
    })
});