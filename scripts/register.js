$(document).ready(function() {
    Register.check.exist('username');
    Register.check.exist('email');
    Register.check.password('password', 'confirm_password');
    Register.check.email('email', 'confirm_email');

    $('#register-form').find('input[type="reset"]').on('click', function() {
        Register.clear();
    });
});