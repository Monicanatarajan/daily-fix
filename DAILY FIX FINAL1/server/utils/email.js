const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("RESEND_API_KEY loaded:", !!process.env.RESEND_API_KEY);

const sendOTP = async (email, otp) => {
    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Your Daily Fix OTP Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #0948b3;">Daily Fix - OTP Verification</h2>
                <p>Use the OTP below to verify your account. It expires in <strong>5 minutes</strong>.</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0948b3; margin: 24px 0;">${otp}</div>
                <p style="color: #888; font-size: 12px;">If you did not request this, ignore this email.</p>
            </div>
        `
    });

    if (error) {
        console.error("Resend error:", error);
        throw new Error(error.message);
    }

    console.log("OTP sent successfully. Resend ID:", data?.id);
};

module.exports = { sendOTP };
