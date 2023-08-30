// Require the library
const User = require("../models/userModel");

// Paystack webhook helpers: Functions that should be called on paystack event updates
// invoicePaymentFailed, invoiceCreation, invoiceUpdate, subscriptionNotRenewed, subscriptionDisabled, chargeSuccess

let endDate;

function addDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    endDate = result.toISOString();
}

const chargeSuccess = async (data) => {
    try {
        const output = data.data;
        const reference = output.reference;
        // console.log(output);

        const user = await User.findOne({ paystack_ref: reference });
        // console.log(user, reference);
        const userId = user._id;
        console.log("Updating charge status");
        if (!user)
            return ({
                data: {},
                message: "User doesn't exist",
                status: 1,
            });

        if (user.paystack_ref == "success")
            return ({
                data: {},
                message: "Transaction has been verified",
                status: 1,
            });

        // add days to plan
        const duration = 365;
        const startDate = output.paid_at;


        addDays(startDate, duration);

        const update = {
            paystack_ref: output.status,
            isSubscribed: true,
            timeSubscribed: output.paid_at,
            subscriptionDuration: duration,
            subscriptionEndDate: endDate
        };
        await User.findByIdAndUpdate(userId, update);
        console.log("Charge Successful");

    } catch (error) {
        console.log({ data: {}, error: `${error.message}`, status: 1 });
    }
};

// subscriptionDisabled, invoicePaymentFailed
const cancelSubscription = async (data) => {
    try {
        const output = data.data;
        const reference = output.reference;
        // console.log(output);

        const user = await User.findOne({ paystack_ref: reference });
        // console.log(user, reference);
        const userId = user._id;
        console.log("Cancelling subscription...");
        if (!user)
            return ({
                data: {},
                message: "User doesn't exist",
                status: 1,
            });

        const update = {
            paystack_ref: "cancelled",
            isSubscribed: false,
        };
        await User.findByIdAndUpdate(userId, update);
        console.log("Subscription Cancelled");

    } catch (error) {
        console.log({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const checkSubscription = async (data) => {
    try {
        const output = data.data;
        const reference = output.reference;
        // console.log(output);

        const user = await User.findOne({ paystack_ref: reference });
        // console.log(user, reference);
        const userId = user._id;
        console.log("Verifying subscription...");
        if (!user)
            return ({
                data: {},
                message: "User doesn't exist",
                status: 1,
            });

        // convert time to seconds
        const todaysDateInSeconds = Date.now() / 1000;
        const timeSubscribedInSeconds = user.endDate / 1000;

        if (todaysDateInSeconds >= timeSubscribedInSeconds) {
            const update = {
                paystack_ref: "cancelled",
                isSubscribed: false,
            };
            await User.findByIdAndUpdate(userId, update);
        } else {
            console.log("Subscription Ongoing");
        }

    } catch (error) {
        console.log({ data: {}, error: `${error.message}`, status: 1 });
    }
};

module.exports = {
    chargeSuccess,
    cancelSubscription,
    checkSubscription,
};