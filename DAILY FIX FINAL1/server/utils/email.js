const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY);

const sendOTP = async (email, otp) => {
    try {
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Your OTP Code',
            html: `<h2>Your OTP is: ${otp}</h2>`
        });
        console.log("RESEND RESPONSE:", response);
        console.log("OTP sent successfully");
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
};

module.exports = { sendOTP };
