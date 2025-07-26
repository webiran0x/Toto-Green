// toto-app/utils/helpers.js

/**
 * تولید یک رشته تصادفی با طول مشخص.
 * @param {number} length - طول رشته تصادفی مورد نظر.
 * @returns {string} - رشته تصادفی تولید شده.
 */
const generateRandomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

module.exports = {
    generateRandomString
};
