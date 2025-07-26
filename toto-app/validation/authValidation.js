const Joi = require('joi');

// Schema برای ثبت نام کاربر (مثلاً در authController.registerUser)
const registerSchema = Joi.object({
    username: Joi.string()
        .alphanum() // فقط حروف و اعداد
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': 'نام کاربری فقط می‌تواند شامل حروف و اعداد باشد.',
            'string.min': 'نام کاربری باید حداقل شامل {#limit} کاراکتر باشد.',
            'string.max': 'نام کاربری نمی‌تواند بیشتر از {#limit} کاراکتر باشد.',
            'any.required': 'نام کاربری اجباری است.'
        }),
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'ir', 'io'] } }) // دامنه های مجاز را اینجا اضافه کنید
        .required()
        .messages({
            'string.email': 'فرمت ایمیل نامعتبر است.',
            'any.required': 'ایمیل اجباری است.'
        }),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$')) // حداقل ۸ کاراکتر، شامل حروف کوچک و بزرگ، عدد و کاراکتر خاص
        .required()
        .messages({
            'string.pattern.base': 'رمز عبور باید حداقل ۸ کاراکتر و شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص باشد.',
            'any.required': 'رمز عبور اجباری است.'
        }),
    referrerUsername: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .optional() // ارجاع‌دهنده اختیاری است
        .allow('') // <--- جدید: اجازه می‌دهد رشته خالی نیز ارسال شود
        .messages({
            'string.alphanum': 'نام کاربری ارجاع‌دهنده فقط می‌تواند شامل حروف و اعداد باشد.',
            'string.min': 'نام کاربری ارجاع‌دهنده باید حداقل شامل {#limit} کاراکتر باشد.',
            'string.max': 'نام کاربری ارجاع‌دهنده نمی‌تواند بیشتر از {#limit} کاراکتر باشد.',
        }),
});

// Schema برای ورود کاربر (مثلاً در authController.loginUser)
const loginSchema = Joi.object({
    usernameOrEmail: Joi.string()
        .required()
        .messages({
            'any.required': 'نام کاربری یا ایمیل اجباری است.'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'رمز عبور اجباری است.'
        }),
});

module.exports = {
    registerSchema,
    loginSchema
};