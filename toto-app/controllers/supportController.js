// toto-app/controllers/supportController.js
// کنترلر برای مدیریت تیکت‌های پشتیبانی

const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const logger = require('../utils/logger');
const mongoose = require('mongoose'); // برای اعتبارسنجی ObjectId

// @desc    ایجاد تیکت پشتیبانی جدید (توسط کاربر)
// @route   POST /api/support/tickets
// @access  Private (User)
const createTicket = async (req, res) => {
    const { subject, description, priority } = req.body;
    const userId = req.user._id;

    if (!subject || !description) {
        return res.status(400).json({ message: 'لطفاً موضوع و توضیحات تیکت را وارد کنید.' });
    }

    try {
        const newTicket = await SupportTicket.create({
            user: userId,
            subject,
            description,
            priority: priority || 'low', // پیش‌فرض 'low'
            messages: [{ sender: userId, message: description }] // اولین پیام همان توضیحات است
        });
        logger.info(`User ${req.user.username} (ID: ${userId}) created a new support ticket (ID: ${newTicket._id}).`);
        res.status(201).json({
            message: 'تیکت پشتیبانی شما با موفقیت ثبت شد.',
            ticket: newTicket
        });
    } catch (error) {
        logger.error(`Error creating support ticket for user ${userId}: ${error.message}`);
        res.status(500).json({ message: 'خطا در ثبت تیکت پشتیبانی.' });
    }
};

// @desc    دریافت تمام تیکت‌های پشتیبانی (برای ادمین/پشتیبانی)
// @route   GET /api/support/admin/tickets
// @access  Private (Admin/Support)
const getUserTickets = async (req, res) => { // <--- نام تابع به getUserTickets تغییر یافت
    try {
        // ادمین می‌تواند همه تیکت‌ها را ببیند، پشتیبانی فقط تیکت‌های اختصاص داده شده یا باز
        let query = {};
        if (req.user.role === 'support') {
            query.$or = [
                { assignedTo: req.user._id },
                { status: { $in: ['open', 'in_progress'] } } // پشتیبانی می‌تواند تیکت‌های باز را نیز ببیند
            ];
        }

        const tickets = await SupportTicket.find(query)
            .populate('user', 'username email') // اطلاعات کاربر ایجادکننده
            .populate('assignedTo', 'username') // اطلاعات ادمین/پشتیبانی اختصاص داده شده
            .populate('messages.sender', 'username role') // اطلاعات فرستنده هر پیام
            .sort({ createdAt: -1 }); // جدیدترین تیکت‌ها ابتدا

        logger.info(`Admin/Support ${req.user.username} fetched ${tickets.length} support tickets.`);
        res.json(tickets);
    } catch (error) {
        logger.error(`Error fetching all support tickets for admin/support ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت تیکت‌های پشتیبانی.' });
    }
};

// @desc    دریافت تیکت‌های پشتیبانی یک کاربر خاص (توسط خود کاربر لاگین شده)
// @route   GET /api/support/tickets/my
// @access  Private (User)
const getMyTickets = async (req, res) => { // <--- تابع جدید برای کاربر
    try {
        const userId = req.user._id;
        const tickets = await SupportTicket.find({ user: userId })
            .populate('user', 'username email')
            .populate('assignedTo', 'username')
            .populate('messages.sender', 'username role')
            .sort({ createdAt: -1 });

        logger.info(`User ${req.user.username} (ID: ${userId}) fetched ${tickets.length} own support tickets.`);
        res.json(tickets);
    } catch (error) {
        logger.error(`Error fetching user's own support tickets for user ${req.user._id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت تیکت‌های شما.' });
    }
};


// @desc    دریافت یک تیکت پشتیبانی خاص بر اساس ID
// @route   GET /api/support/tickets/:id
// @access  Private (User/Admin/Support)
const getTicketById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه تیکت نامعتبر است.' });
    }

    try {
        const ticket = await SupportTicket.findById(id)
            .populate('user', 'username email')
            .populate('assignedTo', 'username')
            .populate('messages.sender', 'username role');

        if (!ticket) {
            logger.warn(`Ticket ID ${id} not found.`);
            return res.status(404).json({ message: 'تیکت یافت نشد.' });
        }

        // بررسی دسترسی: کاربر فقط تیکت‌های خودش را می‌تواند ببیند. ادمین/پشتیبانی می‌تواند همه را ببیند.
        if (userRole === 'user' && ticket.user._id.toString() !== userId.toString()) {
            logger.warn(`Access denied: User ${req.user.username} (ID: ${userId}) tried to access ticket ${id} belonging to another user.`);
            return res.status(403).json({ message: 'دسترسی غیرمجاز به این تیکت.' });
        }
        // اگر نقش پشتیبانی است، باید تیکت به او اختصاص داده شده باشد یا وضعیت باز/در حال پردازش باشد
        if (userRole === 'support' && ticket.user._id.toString() !== userId.toString() &&
            (!ticket.assignedTo || ticket.assignedTo.toString() !== userId.toString()) &&
            !['open', 'in_progress'].includes(ticket.status)) {
            logger.warn(`Access denied: Support user ${req.user.username} (ID: ${userId}) tried to access ticket ${id} not assigned to them or not open/in_progress.`);
            return res.status(403).json({ message: 'دسترسی غیرمجاز به این تیکت.' });
        }


        logger.info(`User ${req.user.username} (ID: ${userId}) viewed ticket ID: ${id}.`);
        res.json(ticket);
    } catch (error) {
        logger.error(`Error fetching ticket ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت تیکت.' });
    }
};

// @desc    اضافه کردن پیام جدید به تیکت پشتیبانی
// @route   POST /api/support/tickets/:id/messages
// @access  Private (User/Admin/Support)
const addMessageToTicket = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: 'پیام نمی‌تواند خالی باشد.' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه تیکت نامعتبر است.' });
    }

    try {
        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
            logger.warn(`Attempt to add message to non-existent ticket ID: ${id}.`);
            return res.status(404).json({ message: 'تیکت یافت نشد.' });
        }

        // بررسی دسترسی: فقط کاربر صاحب تیکت، ادمین یا پشتیبانی اختصاص داده شده می‌تواند پیام دهد
        if (senderRole === 'user' && ticket.user.toString() !== senderId.toString()) {
            logger.warn(`Access denied: User ${req.user.username} (ID: ${senderId}) tried to add message to ticket ${id} belonging to another user.`);
            return res.status(403).json({ message: 'دسترسی غیرمجاز به این تیکت.' });
        }
        if (senderRole === 'support' && ticket.user.toString() !== senderId.toString() &&
            (!ticket.assignedTo || ticket.assignedTo.toString() !== senderId.toString())) {
            logger.warn(`Access denied: Support user ${req.user.username} (ID: ${senderId}) tried to add message to ticket ${id} not assigned to them.`);
            return res.status(403).json({ message: 'دسترسی غیرمجاز به این تیکت.' });
        }

        // اگر تیکت بسته شده و کاربر عادی پیام می‌دهد، اجازه ندهید
        if (ticket.status === 'closed' && req.user.role === 'user') {
             logger.warn(`User ${req.user.username} (ID: ${senderId}) tried to add message to a closed ticket ${id}.`);
             return res.status(400).json({ message: 'این تیکت بسته شده است و نمی‌توانید به آن پیام دهید.' });
        }


        ticket.messages.push({ sender: senderId, message });
        // اگر کاربر عادی پیام داد، وضعیت را به 'open' یا 'in_progress' برگردان
        if (req.user.role === 'user' && ticket.status === 'resolved') {
            ticket.status = 'in_progress'; // یا 'open'
        }
        await ticket.save();

        // Populate کردن فرستنده پیام جدید برای بازگرداندن به فرانت‌اند
        const populatedTicket = await SupportTicket.findById(id)
            .populate('user', 'username email')
            .populate('assignedTo', 'username')
            .populate('messages.sender', 'username role');

        logger.info(`User ${req.user.username} (ID: ${senderId}) added message to ticket ID: ${id}.`);
        res.status(201).json({
            message: 'پیام با موفقیت به تیکت اضافه شد.',
            ticket: populatedTicket // ارسال تیکت کامل با پیام‌های به‌روز شده
        });
    } catch (error) {
        logger.error(`Error adding message to ticket ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در ارسال پیام.' });
    }
};

// @desc    به‌روزرسانی وضعیت تیکت (توسط ادمین/پشتیبانی)
// @route   PUT /api/support/admin/tickets/:id/status
// @access  Private (Admin/Support)
const updateTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user._id;

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'وضعیت نامعتبر است.' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه تیکت نامعتبر است.' });
    }

    try {
        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'تیکت یافت نشد.' });
        }

        // فقط ادمین یا پشتیبانی اختصاص داده شده می‌تواند وضعیت را تغییر دهد
        if (req.user.role === 'support' && ticket.user.toString() !== adminId.toString() &&
            (!ticket.assignedTo || ticket.assignedTo.toString() !== adminId.toString())) {
            logger.warn(`Access denied: Support user ${req.user.username} (ID: ${adminId}) tried to update status of ticket ${id} not assigned to them.`);
            return res.status(403).json({ message: 'دسترسی غیرمجاز به این تیکت.' });
        }


        ticket.status = status;
        ticket.adminNotes = adminNotes || ticket.adminNotes;
        await ticket.save();

        logger.info(`Admin/Support ${req.user.username} updated status of ticket ID ${id} to ${status}.`);
        res.json({ message: 'وضعیت تیکت با موفقیت به‌روزرسانی شد.', ticket });
    } catch (error) {
        logger.error(`Error updating status for ticket ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در به‌روزرسانی وضعیت تیکت.' });
    }
};

// @desc    اختصاص تیکت به ادمین/پشتیبانی
// @route   PUT /api/support/admin/tickets/:id/assign
// @access  Private (Admin)
const assignTicket = async (req, res) => {
    const { id } = req.params;
    const { assignedToUserId } = req.body; // شناسه کاربری که تیکت به او اختصاص داده می‌شود

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'شناسه تیکت نامعتبر است.' });
    }
    if (assignedToUserId && !mongoose.Types.ObjectId.isValid(assignedToUserId)) {
        return res.status(400).json({ message: 'شناسه کاربر اختصاص داده شده نامعتبر است.' });
    }

    try {
        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'تیکت یافت نشد.' });
        }

        // بررسی کنید که assignedToUserId به یک کاربر با نقش 'admin' یا 'support' اشاره کند
        if (assignedToUserId) {
            const assignedUser = await User.findById(assignedToUserId);
            if (!assignedUser || !['admin', 'support'].includes(assignedUser.role)) {
                return res.status(400).json({ message: 'کاربر اختصاص داده شده باید ادمین یا پشتیبانی باشد.' });
            }
            ticket.assignedTo = assignedToUserId;
        } else {
            ticket.assignedTo = null; // لغو اختصاص
        }

        await ticket.save();

        logger.info(`Admin ${req.user.username} assigned ticket ID ${id} to ${assignedToUserId ? assignedToUserId : 'nobody'}.`);
        res.json({ message: 'تیکت با موفقیت اختصاص داده شد.', ticket });
    } catch (error) {
        logger.error(`Error assigning ticket ID ${id}: ${error.message}`);
        res.status(500).json({ message: 'خطا در اختصاص تیکت.' });
    }
};

// @desc    دریافت تیکت‌ها بر اساس وضعیت
// @route   GET /api/support/admin/tickets/status/:status
// @access  Private (Admin/Support)
const getTicketsByStatus = async (req, res) => {
    const { status } = req.params;
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'وضعیت نامعتبر است.' });
    }

    try {
        const tickets = await SupportTicket.find({ status })
            .populate('user', 'username email')
            .populate('assignedTo', 'username')
            .populate('messages.sender', 'username role')
            .sort({ createdAt: -1 });
        logger.info(`Admin/Support ${req.user.username} fetched tickets by status: ${status}. Found ${tickets.length} tickets.`);
        res.json(tickets);
    } catch (error) {
        logger.error(`Error fetching tickets by status ${status}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت تیکت‌ها بر اساس وضعیت.' });
    }
};

// @desc    دریافت تیکت‌ها بر اساس اولویت
// @route   GET /api/support/admin/tickets/priority/:priority
// @access  Private (Admin/Support)
const getTicketsByPriority = async (req, res) => {
    const { priority } = req.params;
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        return res.status(400).json({ message: 'اولویت نامعتبر است.' });
    }

    try {
        const tickets = await SupportTicket.find({ priority })
            .populate('user', 'username email')
            .populate('assignedTo', 'username')
            .populate('messages.sender', 'username role')
            .sort({ createdAt: -1 });
        logger.info(`Admin/Support ${req.user.username} fetched tickets by priority: ${priority}. Found ${tickets.length} tickets.`);
        res.json(tickets);
    } catch (error) {
        logger.error(`Error fetching tickets by priority ${priority}: ${error.message}`);
        res.status(500).json({ message: 'خطا در دریافت تیکت‌ها بر اساس اولویت.' });
    }
};


module.exports = {
    createTicket,
    getUserTickets, // <--- نام اکسپورت شده
    getTicketById,
    addMessageToTicket,
    updateTicketStatus,
    assignTicket,
    getTicketsByStatus,
    getTicketsByPriority,
    getMyTickets // <--- اضافه شد
};
