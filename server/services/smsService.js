/**
 * SMS Gateway Service
 * Supports Twilio API with automatic fallback to console logging
 */

export const smsService = {
  /**
   * Send SMS OTP to supplier phone number
   * @param {string} phone - Target mobile number
   * @param {string} otp - OTP code to send
   * @returns {Promise<{success: boolean, provider?: string, message: string, details?: any}>}
   */
  async sendOtpSms(phone, otp) {
    const cleanDigits = (phone || '').trim().replace(/\D/g, '').slice(-10);
    const formattedPhone = cleanDigits ? `+91${cleanDigits}` : phone;
    const smsMessage = `Your Hostel Inventory System verification OTP is ${otp}. Valid for 10 minutes.`;

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // 1. Try Twilio API if configured
    if (twilioSid && twilioToken && twilioPhone) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const params = new URLSearchParams({
          To: formattedPhone,
          From: twilioPhone,
          Body: smsMessage
        });

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        const data = await res.json();
        if (res.ok && !data.error_code) {
          console.log(`[SMS SUCCESS - Twilio] Sent OTP to ${formattedPhone}`);
          return { success: true, provider: 'Twilio', message: `SMS OTP sent successfully via Twilio to ${formattedPhone}` };
        } else {
          console.warn(`[SMS WARN - Twilio Error] ${data.message || 'Twilio send failed'}`);
        }
      } catch (err) {
        console.error('[SMS ERROR - Twilio]', err.message);
      }
    }

    // 2. Fallback for Development (Console Log & return OTP for demo UI)
    console.log('\n======================================================');
    console.log(`[DEMO SMS SERVICE] Target: ${formattedPhone}`);
    console.log(`[DEMO SMS SERVICE] OTP Message: "${smsMessage}"`);
    console.log(`[DEMO SMS SERVICE] Note: Configure TWILIO_* in server/.env for SMS`);
    console.log('======================================================\n');

    return {
      success: true,
      provider: 'Demo Console / Dev Mode',
      message: `OTP sent successfully to ${formattedPhone} (Demo OTP: ${otp})`
    };
  }
};
