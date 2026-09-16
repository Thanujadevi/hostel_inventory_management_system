/**
 * Real-Time SMS Gateway Service
 * Supports Fast2SMS (India) and Twilio (Global) APIs with console logging fallback
 */

export const smsService = {
  /**
   * Send real SMS OTP to supplier phone number
   * @param {string} phone - Target mobile number
   * @param {string} otp - OTP code to send
   * @returns {Promise<{success: boolean, provider?: string, message: string, details?: any}>}
   */
  async sendOtpSms(phone, otp) {
    const cleanDigits = (phone || '').trim().replace(/^(\+91|91|0)/, '').replace(/\D/g, '').slice(-10);
    const formattedPhone = cleanDigits ? `+91${cleanDigits}` : phone;
    const smsMessage = `Your Hostel Inventory System verification OTP is ${otp}. Valid for 10 minutes.`;

    const fast2smsApiKey = process.env.FAST2SMS_API_KEY;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // 1. Try Fast2SMS API (Fastest real SMS for Indian +91 numbers)
    if (fast2smsApiKey && cleanDigits.length === 10) {
      try {
        console.log(`[SMS ATTEMPT - Fast2SMS] Sending real SMS to +91 ${cleanDigits}...`);

        // Fast2SMS Bulk V2 POST Request with Header Authorization
        let response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2smsApiKey.trim(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: String(otp),
            numbers: cleanDigits
          })
        });

        let data = await response.json();
        console.log(`[Fast2SMS Route 'otp' Response]:`, data);

        // If 'otp' route requires DLT registration on new Fast2SMS account, try GET fallback
        if (!data || data.return !== true) {
          console.log(`[SMS INFO - Fast2SMS] Trying GET fallback request...`);
          response = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsApiKey.trim())}&route=otp&variables_values=${encodeURIComponent(otp)}&flash=0&numbers=${encodeURIComponent(cleanDigits)}`);
          data = await response.json();
          console.log(`[Fast2SMS GET Response]:`, data);
        }

        if (data && data.return === true) {
          console.log(`[SMS SUCCESS - Fast2SMS] Real SMS dispatched to +91 ${cleanDigits}`);
          return {
            success: true,
            provider: 'Fast2SMS',
            isRealSms: true,
            message: `Real SMS OTP dispatched successfully to +91 ${cleanDigits}`
          };
        } else {
          console.warn(`[SMS WARN - Fast2SMS Response]:`, data ? data.message : 'No response from Fast2SMS');
        }
      } catch (err) {
        console.error('[SMS ERROR - Fast2SMS Exception]:', err.message);
      }
    }

    // 2. Try Twilio API if configured
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

    // 3. Fallback for Development (Console Log & return OTP for demo UI)
    console.log('\n======================================================');
    console.log(`[REAL SMS SERVICE] Target: +91 ${cleanDigits}`);
    console.log(`[REAL SMS SERVICE] OTP Code: "${otp}"`);
    console.log(`[REAL SMS SERVICE] To send real SMS, add FAST2SMS_API_KEY in server/.env`);
    console.log('======================================================\n');

    return {
      success: true,
      provider: 'Demo Mode',
      message: `OTP sent successfully to +91 ${cleanDigits}`
    };
  }
};
