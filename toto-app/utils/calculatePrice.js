const calculatePrice = (predictions) => {
    let combinations = 1;

    // تعداد انتخاب‌های ترکیبی را محاسبه می‌کند
    for (const prediction of predictions) {
        combinations *= prediction.chosenOutcome.length;
    }

    // قیمت پایه برای هر ترکیب (مثلاً 100 واحد پول)
    const basePricePerCombination = 100;

    return combinations * basePricePerCombination;
};

module.exports = calculatePrice;