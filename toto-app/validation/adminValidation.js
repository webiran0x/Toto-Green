const Joi = require('joi');

// Schema برای ایجاد کاربر جدید توسط ادمین (مثلاً در adminController.createUser)
const createUserByAdminSchema = Joi.object({
    username: Joi.string()
        .alphanum()
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
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'ir', 'io'] } })
        .required()
        .messages({
            'string.email': 'فرمت ایمیل نامعتبر است.',
            'any.required': 'ایمیل اجباری است.'
        }),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'))
        .required()
        .messages({
            'string.pattern.base': 'رمز عبور باید حداقل ۸ کاراکتر و شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص باشد.',
            'any.required': 'رمز عبور اجباری است.'
        }),
    role: Joi.string()
        .valid('user', 'admin', 'support') // نقش‌های مجاز
        .default('user')
        .optional()
        .messages({
            'any.only': 'نقش نامعتبر است. نقش‌های مجاز: user, admin, support.'
        }),
    balance: Joi.number()
        .min(0)
        .default(0)
        .optional()
        .messages({
            'number.base': 'موجودی باید یک عدد باشد.',
            'number.min': 'موجودی نمی‌تواند منفی باشد.'
        }),
    score: Joi.number()
        .min(0)
        .default(0)
        .optional()
        .messages({
            'number.base': 'امتیاز باید یک عدد باشد.',
            'number.min': 'امتیاز نمی‌تواند منفی باشد.'
        }),
    level: Joi.string()
        .valid('normal', 'vip', 'moderator') // سطوح مجاز
        .default('normal')
        .optional()
        .messages({
            'any.only': 'سطح کاربری نامعتبر است. سطوح مجاز: normal, vip, moderator.'
        }),
});

// Schema برای به‌روزرسانی اطلاعات کاربر توسط ادمین (مثلاً در adminController.updateUser)
const updateUserByAdminSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .optional()
        .messages({
            'string.alphanum': 'نام کاربری فقط می‌تواند شامل حروف و اعداد باشد.',
            'string.min': 'نام کاربری باید حداقل شامل {#limit} کاراکتر باشد.',
            'string.max': 'نام کاربری نمی‌تواند بیشتر از {#limit} کاراکتر باشد.'
        }),
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'ir', 'io'] } })
        .optional()
        .messages({
            'string.email': 'فرمت ایمیل نامعتبر است.'
        }),
    role: Joi.string()
        .valid('user', 'admin', 'support')
        .optional()
        .messages({
            'any.only': 'نقش نامعتبر است. نقش‌های مجاز: user, admin, support.'
        }),
    status: Joi.string()
        .valid('active', 'blocked')
        .optional()
        .messages({
            'any.only': 'وضعیت نامعتبر است. وضعیت‌های مجاز: active, blocked.'
        }),
    balance: Joi.number()
        .messages({ // اینجا اجازه تغییر به منفی هم می‌دهیم اما منطق کسر باید در کنترلر باشد
            'number.base': 'موجودی باید یک عدد باشد.'
        }),
    score: Joi.number()
        .messages({
            'number.base': 'امتیاز باید یک عدد باشد.'
        }),
    level: Joi.string()
        .valid('normal', 'vip', 'moderator')
        .optional()
        .messages({
            'any.only': 'سطح کاربری نامعتبر است. سطوح مجاز: normal, vip, moderator.'
        }),
    // رمز عبور را مستقیماً در اینجا تغییر نمی‌دهیم، بلکه یک مسیر جداگانه برای آن خواهیم داشت
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'))
        .optional()
        .messages({
            'string.pattern.base': 'رمز عبور باید حداقل ۸ کاراکتر و شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص باشد.',
        }),
}).min(1) // حداقل یک فیلد برای به‌روزرسانی باید ارائه شود
.messages({
    'object.min': 'حداقل یک فیلد برای به‌روزرسانی کاربر باید ارائه شود.'
});

// Schema برای ایجاد بازی جدید Toto (مثلاً در adminController.createTotoGame)
const createTotoGameSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.min': 'نام بازی باید حداقل شامل {#limit} کاراکتر باشد.',
            'string.max': 'نام بازی نمی‌تواند بیشتر از {#limit} کاراکتر باشد.',
            'any.required': 'نام بازی اجباری است.'
        }),
    deadline: Joi.date()
        .iso() // فرمت ISO 8601 (مثل 'YYYY-MM-DDTHH:mm:ssZ')
        .min(new Date()) // مهلت باید در آینده باشد
        .required()
        .messages({
            'date.base': 'مهلت باید یک تاریخ معتبر باشد.',
            'date.min': 'مهلت باید در آینده باشد.',
            'any.required': 'مهلت اجباری است.'
        }),
    matches: Joi.array().items(
        Joi.object({
            homeTeam: Joi.string().min(2).max(50).required().messages({'any.required': 'نام تیم میزبان اجباری است.'}),
            awayTeam: Joi.string().min(2).max(50).required().messages({'any.required': 'نام تیم میهمان اجباری است.'}),
            matchDate: Joi.date().iso().required().messages({'any.required': 'تاریخ مسابقه اجباری است.'}),
        })
    ).min(1).max(15).required().messages({ // فرض بر این است که یک بازی Toto می‌تواند 1 تا 15 مسابقه داشته باشد
        'array.base': 'مسابقات باید یک آرایه باشند.',
        'array.min': 'حداقل {#limit} مسابقه برای بازی مورد نیاز است.',
        'array.max': 'حداکثر {#limit} مسابقه برای بازی مجاز است.',
        'any.required': 'مسابقات اجباری هستند.'
    }),
});

// Schema برای تنظیم نتایج بازی Toto (مثلاً در adminController.setTotoGameResults)
const setTotoGameResultsSchema = Joi.object({
    gameId: Joi.string().required().messages({
        'any.required': 'شناسه بازی اجباری است.'
    }),
    results: Joi.array().items(
        Joi.object({
            matchId: Joi.string().required().messages({'any.required': 'شناسه مسابقه اجباری است.'}),
            winner: Joi.string().valid('home', 'away', 'draw').required().messages({
                'any.required': 'برنده مسابقه اجباری است.',
                'any.only': 'برنده نامعتبر است. (فقط home, away, draw مجاز است)'
            }),
            homeScore: Joi.number().min(0).integer().required().messages({
                'number.base': 'امتیاز تیم میزبان باید یک عدد باشد.',
                'number.min': 'امتیاز تیم میزبان نمی‌تواند منفی باشد.',
                'number.integer': 'امتیاز تیم میزبان باید یک عدد صحیح باشد.',
                'any.required': 'امتیاز تیم میزبان اجباری است.'
            }),
            awayScore: Joi.number().min(0).integer().required().messages({
                'number.base': 'امتیاز تیم میهمان باید یک عدد باشد.',
                'number.min': 'امتیاز تیم میهمان نمی‌تواند منفی باشد.',
                'number.integer': 'امتیاز تیم میهمان باید یک عدد صحیح باشد.',
                'any.required': 'امتیاز تیم میهمان اجباری است.'
            }),
        })
    ).min(1).max(15).required().messages({
        'array.base': 'نتایج باید یک آرایه باشند.',
        'array.min': 'حداقل {#limit} نتیجه برای بازی مورد نیاز است.',
        'array.max': 'حداکثر {#limit} نتیجه برای بازی مجاز است.',
        'any.required': 'نتایج اجباری هستند.'
    }),
});

// Schema برای به‌روزرسانی وضعیت درخواست برداشت (مثلاً در adminController.updateWithdrawalRequestStatus)
const updateWithdrawalStatusSchema = Joi.object({
    withdrawalId: Joi.string().required().messages({
        'any.required': 'شناسه درخواست برداشت اجباری است.'
    }),
    status: Joi.string().valid('approved', 'rejected', 'completed', 'cancelled') // وضعیت‌های مجاز
        .required()
        .messages({
            'any.required': 'وضعیت اجباری است.',
            'any.only': 'وضعیت نامعتبر است. وضعیت‌های مجاز: approved, rejected, completed, cancelled.'
        }),
    adminNote: Joi.string().max(255).optional(),
});

// Schema برای به‌روزرسانی وضعیت واریز رمزارز (مثلاً در adminController.updateCryptoDepositStatus)
const updateCryptoDepositStatusSchema = Joi.object({
    depositId: Joi.string().required().messages({
        'any.required': 'شناسه واریز اجباری است.'
    }),
    status: Joi.string().valid('pending', 'confirmed', 'rejected', 'cancelled')
        .required()
        .messages({
            'any.required': 'وضعیت اجباری است.',
            'any.only': 'وضعیت نامعتبر است. وضعیت‌های مجاز: pending, confirmed, rejected, cancelled.'
        }),
    adminNote: Joi.string().max(255).optional(),
});

// Schema برای به‌روزرسانی تنظیمات ادمین (مثلاً در adminController.updateAdminSettings)
const updateAdminSettingsSchema = Joi.object({
    minDeposit: Joi.number().positive().optional().messages({
        'number.positive': 'حداقل واریز باید مثبت باشد.'
    }),
    minWithdrawal: Joi.number().positive().optional().messages({
        'number.positive': 'حداقل برداشت باید مثبت باشد.'
    }),
    referralCommissionPercentage: Joi.number().min(0).max(100).optional().messages({
        'number.min': 'درصد کمیسیون باید حداقل 0 باشد.',
        'number.max': 'درصد کمیسیون نمی‌تواند بیشتر از 100 باشد.'
    }),
    // هر تنظیمات دیگری که در مدل AdminSettings.js دارید، اینجا اضافه کنید.
}).min(1) // حداقل یک فیلد برای به‌روزرسانی باید ارائه شود
.messages({
    'object.min': 'حداقل یک فیلد برای به‌روزرسانی تنظیمات باید ارائه شود.'
});


module.exports = {
    createUserByAdminSchema,
    updateUserByAdminSchema,
    createTotoGameSchema,
    setTotoGameResultsSchema,
    updateWithdrawalStatusSchema,
    updateCryptoDepositStatusSchema,
    updateAdminSettingsSchema,
};