$(document).ready(function() {
    function confirmCss(status) {
        return {'background-image': 'url("/images/' + status + '.png")', 'background-repeat': 'no-repeat', 'background-position-y': 'center', 'background-position-x': '99%', 'padding-right': '30px', 'background-size': '25px'}
    }

    function checkExists(value) {
        $('#register-form').find('input[name="' + value + '"]').on('blur', function(e) {
            var input = $(this);
    
            if ($(input).val() !== '') {
                $.post({
                    url: '/check-exists',
                    data: {
                        string: $(input).val(),
                        type: value
                    },
                    success: function(resp) {
                        if (resp.status === 'not exist') {
                            $(input).css(confirmCss('check'));
                        } else {
                            $(input).css(confirmCss('x'));
                        }
                    }
                });
            } else {
                $(input).removeAttr('style');
            }
        });
    }

    checkExists('username');
    checkExists('email');

    function passwordCheck(input, confirmInput) {
        var entry = $('#register-form').find('input[name="' + input + '"]');
        var confirm = $('#register-form').find('input[name="' + confirmInput + '"]');

        $(entry).on('blur', function(e) {
            if ($(entry).val().length >= 6) {
                if ($(confirm).val().length > 0) {
                    if ($(entry).val() === $(confirm).val()) {
                        $(entry).css(confirmCss('check'));
                        $(confirm).css(confirmCss('check'));
                    } else {
                        $(entry).css(confirmCss('x'));
                        $(confirm).css(confirmCss('x'));
                    }
                } else {
                    $(entry).css(confirmCss('check'));
                }
            } else if ($(entry).val().length > 0 && $(entry).val().length < 6) {
                if ($(confirm).val().length > 0) {
                    $(entry).css(confirmCss('x'));
                    $(confirm).css(confirmCss('x'));
                } else {
                    $(entry).css(confirmCss('x'));
                }
            } else if ($(entry).val().length === 0) {
                if ($(confirm).val().length > 0) {
                    $(entry).css(confirmCss('x'));
                    $(confirm).css(confirmCss('x'));
                } else {
                    $(entry).removeAttr('style');
                    $(confirm).removeAttr('style');
                }
            }
        });

        $(confirm).on('blur', function(e) {
            if ($(entry).val() !== '') {
                if ($(entry).val().length >= 6) {
                    if ($(entry).val() === $(confirm).val()) {
                        $(entry).css(confirmCss('check'));
                        $(confirm).css(confirmCss('check'));
                    } else {
                        $(entry).css(confirmCss('x'));
                        $(confirm).css(confirmCss('x'));
                    }
                } else {
                    $(entry).css(confirmCss('x'));
                    $(confirm).css(confirmCss('x'));
                }
            } else {
                if ($(confirm).val() !== '') {
                    $(entry).css(confirmCss('x'));
                    $(confirm).css(confirmCss('x'));
                } else {
                    $(entry).removeAttr('style');
                    $(confirm).removeAttr('style');
                }
            }
        });
    }

    passwordCheck('password', 'confirm_password');

    function emailCheck(input, confirmInput) {
        var entry = $('#register-form').find('input[name="' + input + '"]');
        var confirm = $('#register-form').find('input[name="' + confirmInput + '"]');
        var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        $(entry).on('blur', function() {
            if (emailPattern.test($(entry).val())) {
                $(entry).css(confirmCss('check'));
            } else {
                $(entry).css(confirmCss('x'));
            }
        });

        $(confirm).on('blur', function() {
            if (emailPattern.test($(confirm).val())) {
                if ($(confirm).val() === $(entry).val()) {
                    $(confirm).css(confirmCss('check'));
                } else {
                    $(confirm).css(confirmCss('x'));
                }
            } else {
                $(confirm).css(confirmCss('x'));
            }
        });
    }

    emailCheck('email', 'confirm_email');

    /* 
    * Using form's default submission
    
    $('#register-form').on('submit', function(e) {
        e.preventDefault();

        var form = $(this);

        $.post({
            url: '/register',
            data: $(form).serialize(),
            success: function(resp) {
                if (resp.status === 'success') {
                    location.href = '/response'
                }
            }
        });
    }); */

    $('#register-form').find('input[type="reset"]').on('click', function() {
        $('#register-form').find('input[type="text"]').removeAttr('style');
        $('#register-form').find('input[type="email"]').removeAttr('style');
        $('#register-form').find('input[type="password"]').removeAttr('style');
    })
});