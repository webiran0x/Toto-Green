const Joi = require('joi');

// Schema برای به‌روزرسانی پروفایل کاربر (مثلاً در userController.updateUserProfile)
const updateUserProfileSchema = Joi.object({
    username: Joi.string()
        .alphanum() // فقط حروف و اعداد
        .min(3)
        .max(30)
        .optional() // اختیاری، کاربر ممکن است فقط ایمیل را تغییر دهد
        .messages({
            'string.alphanum': 'نام کاربری فقط می‌تواند شامل حروف و اعداد باشد.',
            'string.min': 'نام کاربری باید حداقل شامل {#limit} کاراکتر باشد.',
            'string.max': 'نام کاربری نمی‌تواند بیشتر از {#limit} کاراکتر باشد.'
        }),
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'ir', 'io'] } }) // دامنه های مجاز را اینجا اضافه کنید
        .optional() // اختیاری، کاربر ممکن است فقط نام کاربری را تغییر دهد
        .messages({
            'string.email': 'فرمت ایمیل نامعتبر است.'
        }),
    fullName: Joi.string()
        .min(3)
        .max(100)
        .optional()
        .messages({
            'string.min': 'نام کامل باید حداقل شامل {#limit} کاراکتر باشد.',
            'string.max': 'نام کامل نمی‌تواند بیشتر از {#limit} کاراکتر باشد.'
        }),
    phoneNumber: Joi.string()
        .pattern(/^[0-9]{10,15}$/) // مثال: 10 تا 15 رقم
        .optional()
        .messages({
            'string.pattern.base': 'شماره تلفن نامعتبر است.'
        })
}).min(1) // حداقل یک فیلد برای به‌روزرسانی باید ارائه شود
.messages({
    'object.min': 'حداقل یک فیلد برای به‌روزرسانی پروفایل باید ارائه شود.'
});

// Schema برای تغییر رمز عبور کاربر (مثلاً در userController.changeUserPassword)
const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'رمز عبور فعلی اجباری است.'
        }),
    newPassword: Joi.string()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})')) // حداقل ۸ کاراکتر، شامل حروف کوچک و بزرگ، عدد و کاراکتر خاص
        .required()
        .messages({
            'string.pattern.base': 'رمز عبور جدید باید حداقل ۸ کاراکتر و شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص باشد.',
            'any.required': 'رمز عبور جدید اجباری است.'
        }),
    confirmNewPassword: Joi.string()
        .valid(Joi.ref('newPassword')) // باید با newPassword مطابقت داشته باشد
        .required()
        .messages({
            'any.required': 'تایید رمز عبور جدید اجباری است.',
            'any.only': 'تایید رمز عبور جدید با رمز عبور جدید مطابقت ندارد.'
        })
});

// Schema برای درخواست برداشت وجه (مثلاً در userController.requestWithdrawal)
const requestWithdrawalSchema = Joi.object({
    amount: Joi.number()
        .positive() // باید عدد مثبت باشد
        .min(10) // حداقل مبلغ برداشت، این مقدار را بر اساس AdminSettings.js تنظیم کنید
        .required()
        .messages({
            'number.base': 'مبلغ باید یک عدد باشد.',
            'number.positive': 'مبلغ باید مثبت باشد.',
            'number.min': 'حداقل مبلغ برداشت {#limit} است.',
            'any.required': 'مبلغ برداشت اجباری است.'
        }),
    currency: Joi.string()
        .valid('USDT') // ارزهای پشتیبانی شده را اینجا اضافه کنید
        .required()
        .messages({
            'any.required': 'ارز اجباری است.',
            'any.only': 'ارز انتخابی پشتیبانی نمی‌شود.'
        }),
    network: Joi.string()
        .valid('TRC20', 'BEP20', 'ERC20') // شبکه‌های پشتیبانی شده را اینجا اضافه کنید
        .required()
        .messages({
            'any.required': 'شبکه اجباری است.',
            'any.only': 'شبکه انتخابی پشتیبانی نمی‌شود.'
        }),
    walletAddress: Joi.string()
        .required()
        .messages({
            'any.required': 'آدرس کیف پول اجباری است.'
        }),
});

// Schema برای واریز وجه (مثلاً در userController.deposit)
const depositSchema = Joi.object({
    amount: Joi.number()
        .positive() // باید عدد مثبت باشد
        .min(1) // حداقل مبلغ واریز، این مقدار را بر اساس AdminSettings.js تنظیم کنید
        .required()
        .messages({
            'number.base': 'مبلغ باید یک عدد باشد.',
            'number.positive': 'مبلغ باید مثبت باشد.',
            'number.min': 'حداقل مبلغ واریز {#limit} است.',
            'any.required': 'مبلغ واریز اجباری است.'
        }),
    method: Joi.string()
        .valid('crypto', 'manual', 'gateway') // روش‌های واریز پشتیبانی شده را اینجا اضافه کنید
        .required()
        .messages({
            'any.only': 'روش واریز نامعتبر است. روش‌های مجاز: crypto, manual, gateway.',
            'any.required': 'روش واریز اجباری است.'
        }),
    cryptoCurrency: Joi.string()
        .valid('USDT', 'BTC') // ارزهای دیجیتال پشتیبانی شده را اینجا اضافه کنید
        .when('method', {
            is: 'crypto', // فقط زمانی که method 'crypto' باشد، این فیلد اجباری است
            then: Joi.required(),
            otherwise: Joi.forbidden() // در غیر این صورت، مجاز نیست
        })
        .messages({
            'any.required': 'ارز دیجیتال اجباری است.',
            'any.only': 'ارز دیجیتال انتخابی پشتیبانی نمی‌شود.'
        }),
    network: Joi.string()
        .valid('TRC20', 'BEP20', 'ERC20', 'BTC') // شبکه‌های پشتیبانی شده را اینجا اضافه کنید
        .when('method', {
            is: 'crypto', // فقط زمانی که method 'crypto' باشد، این فیلد اجباری است
            then: Joi.required(),
            otherwise: Joi.forbidden()
        })
        .messages({
            'any.required': 'شبکه اجباری است.',
            'any.only': 'شبکه انتخابی پشتیبانی نمی‌شود.'
        }),
});


// Schema برای ارسال فرم پیش بینی بازی (مثلا در userGameController.submitPrediction)
const submitPredictionSchema = Joi.object({
    gameId: Joi.string().required().messages({'any.required': 'شناسه بازی اجباری است.'}),
    predictions: Joi.array().items(
        Joi.object({
            matchId: Joi.string().required().messages({'any.required': 'شناسه مسابقه اجباری است.'}),
            chosenOutcome: Joi.array().items(Joi.string().valid('1', 'X', '2')).min(1).required().messages({
                'array.base': 'نتیجه انتخاب شده باید یک آرایه باشد.',
                'array.min': 'حداقل یک نتیجه برای پیش‌بینی انتخاب شود.',
                'any.required': 'نتیجه انتخاب شده برای مسابقه اجباری است.',
                'any.only': 'نتیجه انتخاب شده نامعتبر است. (فقط 1, X, 2 مجاز است)'
            })
        })
    ).length(15).required().messages({ // فرض بر این است که هر بازی 15 مسابقه دارد
        'array.base': 'پیش‌بینی‌ها باید یک آرایه باشند.',
        'array.length': 'باید دقیقاً {#limit} پیش‌بینی برای بازی‌ها ارائه شود.',
        'any.required': 'پیش‌بینی‌ها اجباری هستند.'
    }),
    formAmount: Joi.number().positive().min(1).required().messages({ // حداقل مبلغ فرم 1 واحد
        'number.base': 'مبلغ فرم باید یک عدد باشد.',
        'number.positive': 'مبلغ فرم باید مثبت باشد.',
        'number.min': 'حداقل مبلغ فرم {#limit} است.',
        'any.required': 'مبلغ فرم اجباری است.'
    })
});

module.exports = {
    updateUserProfileSchema,
    changePasswordSchema,
    requestWithdrawalSchema,
    depositSchema,
    submitPredictionSchema
};