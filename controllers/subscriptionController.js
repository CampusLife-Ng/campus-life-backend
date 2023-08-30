// Require the library
const paystack = require("paystack-api")(process.env.TEST_SECRET);
const User = require("../models/userModel");
const { chargeSuccess, cancelSubscription, checkSubscription, } = require("../helpers/webhookHelpers");

const createPlan = async (req, res) => {
    try {
        const { interval, name, amount } = req.body;

        const response = await paystack.plan.create({
            name,
            amount,
            interval,
        });

        return res
            .status(200)
            .send({
                data: response.data,
                message: response.message,
                status: response.status,
            });

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const getPlans = async (req, res) => {
    try {
        const response = await paystack.plan.list();

        return res
            .status(200)
            .send({
                data: response.data,
                message: response.message,
                status: response.status,
            });

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const addWebhook = async (req, res) => {
    try {
        let data = req.body;
        console.log('Webhook data: ', data);

        switch (data) {
            case data.event = "invoice.payment_failed":
                await cancelSubscription(data);
                console.log("Invoice Failed");
                break;

            case data.event = "invoice.create":
                // invoiceCreation(); 
                console.log("invoice created");
                break;
            case data.event = "invoice.update":
                // invoiceUpdate();
                data.data.status == "success" ?
                    await chargeSuccess(data) :
                    console.log("Update Failed");
                break;
            case data.event = "subscription.not_renew":
                // subscriptionNotRenewed();
                await checkSubscription(data);
                console.log("unrenewed");
                break;
            case data.event = "subscription.disable":
                // subscriptionDisabled();
                await checkSubscription(data);
                console.log("disabled");
                break;

            default:
                // successful charge
                console.log("Implementing charges logic...");
                await chargeSuccess(data);
                console.log("Successful");
                break;
        }

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const initializeTrans = async (req, res) => {
    try {
        let { id } = req.params;
        const { email, plan, } = req.body;

        const response = await paystack.transaction.initialize({
            email: email,
            amount: 300000,
            plan,
        });

        const data = {
            paystack_ref: response.data.reference,
        };

        await User.findByIdAndUpdate(id, data);

        return res
            .status(200)
            .send({
                data: response.data,
                message: response.message,
                status: response.status,
            });

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const verifyTrans = async (req, res) => {
    try {
        let { id } = req.params;

        const user = await User.findById(id);
        if (!user)
            return res.status(401).send({
                data: {},
                message: "User doesn't exist",
                status: 1,
            });

        if (user.paystack_ref == "success")
            return res.status(401).send({
                data: {},
                message: "Transaction has been verified",
                status: 1,
            });

        const response = await paystack.transaction.verify({
            reference: user.paystack_ref
        });

        if (response.data.status == "success") {
            const data = {
                paystack_ref: response.data.status,
                isSubscribed: true,
                paidAt: response.data.paid_at,
            };
            await User.findByIdAndUpdate(id, data);

            return res
                .status(200)
                .send({
                    data: response.data,
                    message: response.message,
                    status: response.status,
                });
        } else {
            return res
                .status(200)
                .send({
                    data: response.data,
                    message: response.message,
                    status: response.status,
                });
        }

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};

module.exports = {
    createPlan,
    initializeTrans,
    verifyTrans,
    addWebhook,
    getPlans,
};