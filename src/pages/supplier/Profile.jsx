import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { MapPin, Building, Landmark, Truck, Save, CheckCircle, AlertCircle } from 'lucide-react';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Puducherry"
];

export const SupplierProfile = ({ onComplete }) => {
  const { user, updateAuthUser } = useAuth();
  const { suppliers, mockApi, showToast, refreshAll } = useData();

  const [loading, setLoading] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Details
    int_Supplier_Id: null,
    txt_Supplier_Code: '',
    txt_Store_Name: '',
    txt_Owner_Name: '',
    txt_Phone: '',
    txt_Email: '',

    // Address Information
    txt_Address_Line1: '',
    txt_Address_Line2: '',
    txt_City: '',
    txt_State: '',
    txt_Pincode: '',
    txt_Country: 'India',

    // Business Details
    txt_GST_Number: '',
    txt_PAN_Number: '',
    txt_Registration_No: '',
    txt_License_No: '',
    txt_Website: '',

    // Bank Details
    txt_Bank_Name: '',
    txt_Account_Holder: '',
    txt_Account_Number: '',
    txt_IFSC_Code: '',
    txt_UPI_ID: '',

    // Delivery Information
    txt_Delivery_Area: '',
    txt_Delivery_Time: 'Within 24 Hours',
    dec_Min_Order_Value: '',
    txt_Payment_Terms: 'Cash',

    txt_Profile_Completed: 'N'
  });

  useEffect(() => {
    // Locate active logged in supplier from Context or Data
    if (user && suppliers.length > 0) {
      const activeSup = suppliers.find(s =>
        s.int_Supplier_Id === user.id ||
        (s.txt_Phone && user.phone && s.txt_Phone.replace(/\D/g, '') === user.phone.replace(/\D/g, ''))
      );

      if (activeSup) {
        setCurrentSupplier(activeSup);
        setFormData({
          int_Supplier_Id: activeSup.int_Supplier_Id,
          txt_Supplier_Code: activeSup.txt_Supplier_Code || user.code || '',
          txt_Store_Name: activeSup.txt_Store_Name || user.company || '',
          txt_Owner_Name: activeSup.txt_Owner_Name || user.name || '',
          txt_Phone: activeSup.txt_Phone || user.phone || '',
          txt_Email: activeSup.txt_Email || user.email || '',

          txt_Address_Line1: activeSup.txt_Address_Line1 || activeSup.txt_Address1 || '',
          txt_Address_Line2: activeSup.txt_Address_Line2 || '',
          txt_City: activeSup.txt_City || '',
          txt_State: activeSup.txt_State || '',
          txt_Pincode: activeSup.txt_Pincode || '',
          txt_Country: activeSup.txt_Country || 'India',

          txt_GST_Number: activeSup.txt_GST_Number || '',
          txt_PAN_Number: activeSup.txt_PAN_Number || '',
          txt_Registration_No: activeSup.txt_Registration_No || '',
          txt_License_No: activeSup.txt_License_No || '',
          txt_Website: activeSup.txt_Website || '',

          txt_Bank_Name: activeSup.txt_Bank_Name || '',
          txt_Account_Holder: activeSup.txt_Account_Holder || activeSup.txt_Owner_Name || '',
          txt_Account_Number: activeSup.txt_Account_Number || '',
          txt_IFSC_Code: activeSup.txt_IFSC_Code || '',
          txt_UPI_ID: activeSup.txt_UPI_ID || '',

          txt_Delivery_Area: activeSup.txt_Delivery_Area || activeSup.txt_City || '',
          txt_Delivery_Time: activeSup.txt_Delivery_Time || 'Within 24 Hours',
          dec_Min_Order_Value: activeSup.dec_Min_Order_Value || '',
          txt_Payment_Terms: activeSup.txt_Payment_Terms || 'Cash',

          txt_Profile_Completed: activeSup.txt_Profile_Completed || 'N'
        });
      } else {
        // Fallback for temporary supplier login
        setFormData(prev => ({
          ...prev,
          txt_Supplier_Code: user.code || 'SUP001',
          txt_Store_Name: user.company || 'Supplier Account',
          txt_Owner_Name: user.name || 'Supplier Owner',
          txt_Phone: user.phone || '',
          txt_Email: user.email || ''
        }));
      }
    }
  }, [user, suppliers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isProfileComplete = () => {
    return (
      formData.txt_Address_Line1.trim() !== '' &&
      formData.txt_City.trim() !== '' &&
      formData.txt_State.trim() !== '' &&
      formData.txt_Pincode.trim() !== '' &&
      formData.txt_GST_Number.trim() !== '' &&
      formData.txt_Delivery_Area.trim() !== ''
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.txt_Address_Line1 || !formData.txt_City || !formData.txt_State || !formData.txt_Pincode) {
      showToast("Please fill all required Address Information fields (*)", "warning");
      return;
    }

    if (!formData.txt_GST_Number) {
      showToast("Please enter your GST Number (*)", "warning");
      return;
    }

    if (!formData.txt_Delivery_Area) {
      showToast("Please specify your Delivery Area (*)", "warning");
      return;
    }

    setLoading(true);
    try {
      const isComplete = isProfileComplete() ? 'Y' : 'N';
      const updatedPayload = {
        ...formData,
        txt_Address1: formData.txt_Address_Line1, // Sync backwards compatibility
        txt_Profile_Completed: isComplete
      };

      const updatedSuppliers = await mockApi.saveSupplier(updatedPayload);
      await refreshAll();

      const savedSupplierRecord = updatedSuppliers.find(s =>
        (formData.int_Supplier_Id && s.int_Supplier_Id === formData.int_Supplier_Id) ||
        (s.txt_Phone && formData.txt_Phone && s.txt_Phone.replace(/\D/g, '') === formData.txt_Phone.replace(/\D/g, ''))
      );

      if (updateAuthUser) {
        updateAuthUser({
          profileCompleted: isComplete === 'Y',
          name: formData.txt_Owner_Name,
          company: formData.txt_Store_Name,
          supplierDetails: savedSupplierRecord || updatedPayload
        });
      }

      if (isComplete === 'Y') {
        showToast("Supplier details saved successfully! Accessing Dashboard...", "success");
        if (onComplete) {
          onComplete();
        }
      } else {
        showToast("Supplier Profile details updated!", "info");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      showToast("Failed to save profile details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const profileStatus = isProfileComplete() ? 'Y' : formData.txt_Profile_Completed;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Supplier Profile & Settings</h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: profileStatus === 'Y' ? 'var(--color-success-bg, #dcfce7)' : 'var(--color-warning-bg, #fef3c7)',
              color: profileStatus === 'Y' ? 'var(--color-success-text, #166534)' : 'var(--color-warning-text, #92400e)',
              border: `1px solid ${profileStatus === 'Y' ? 'var(--color-success-border, #bbf7d0)' : 'var(--color-warning-border, #fde68a)'}`
            }}>
              {profileStatus === 'Y' ? (
                <>
                  <CheckCircle size={14} /> Profile Complete
                </>
              ) : (
                <>
                  <AlertCircle size={14} /> Profile Action Required
                </>
              )}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            Maintain your firm details, address, bank, and delivery terms to receive purchase orders.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <Save size={18} />
          <span>{loading ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      {profileStatus !== 'Y' && (
        <div style={{
          backgroundColor: 'var(--color-warning-bg, #fffbeb)',
          border: '1px solid var(--color-warning-border, #fef3c7)',
          color: 'var(--color-warning-text, #92400e)',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.875rem' }}>
            <strong>Complete Your Registration Details:</strong> Please fill in all mandatory fields marked with an asterisk (<strong>*</strong>) in Address, Business, and Delivery sections below.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: General & Contact Information */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <Building size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>General & Basic Information</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supplier Code</label>
              <input
                type="text"
                className="form-control"
                disabled
                value={formData.txt_Supplier_Code}
                style={{ opacity: 0.7, backgroundColor: 'var(--color-bg-secondary, #f8fafc)' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Business / Firm Name *</label>
              <input
                type="text"
                name="txt_Store_Name"
                className="form-control"
                required
                value={formData.txt_Store_Name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Owner / Contact Person Name *</label>
              <input
                type="text"
                name="txt_Owner_Name"
                className="form-control"
                required
                value={formData.txt_Owner_Name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                name="txt_Phone"
                className="form-control"
                required
                disabled
                value={formData.txt_Phone}
                style={{ opacity: 0.7, backgroundColor: 'var(--color-bg-secondary, #f8fafc)' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="txt_Email"
                className="form-control"
                required
                value={formData.txt_Email}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Address Information */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <MapPin size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Address Information</h3>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Address Line 1 *</label>
              <input
                type="text"
                name="txt_Address_Line1"
                className="form-control"
                required
                placeholder="Door No, Street Name"
                value={formData.txt_Address_Line1}
                onChange={handleChange}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Address Line 2</label>
              <input
                type="text"
                name="txt_Address_Line2"
                className="form-control"
                placeholder="Area / Landmark"
                value={formData.txt_Address_Line2}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                name="txt_City"
                className="form-control"
                required
                placeholder="City"
                value={formData.txt_City}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State *</label>
              <select
                name="txt_State"
                className="form-control"
                required
                value={formData.txt_State}
                onChange={handleChange}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pincode *</label>
              <input
                type="text"
                name="txt_Pincode"
                className="form-control"
                required
                placeholder="Pincode"
                maxLength={6}
                value={formData.txt_Pincode}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country *</label>
              <input
                type="text"
                name="txt_Country"
                className="form-control"
                required
                value={formData.txt_Country || 'India'}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Business Details */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <Building size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Business Details</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">GST Number *</label>
              <input
                type="text"
                name="txt_GST_Number"
                className="form-control"
                required
                placeholder="22AAAAA0000A1Z5"
                value={formData.txt_GST_Number}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                name="txt_PAN_Number"
                className="form-control"
                placeholder="ABCDE1234F"
                value={formData.txt_PAN_Number}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Business Registration No.</label>
              <input
                type="text"
                name="txt_Registration_No"
                className="form-control"
                placeholder="Reg No. / MSME / CIN"
                value={formData.txt_Registration_No}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input
                type="text"
                name="txt_License_No"
                className="form-control"
                placeholder="FSSAI or Trade License No."
                value={formData.txt_License_No}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                type="url"
                name="txt_Website"
                className="form-control"
                placeholder="https://example.com"
                value={formData.txt_Website}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* Section 4: Bank Details */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <Landmark size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Bank Details</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                name="txt_Bank_Name"
                className="form-control"
                placeholder="e.g. State Bank of India"
                value={formData.txt_Bank_Name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Holder Name</label>
              <input
                type="text"
                name="txt_Account_Holder"
                className="form-control"
                placeholder="As per bank passbook"
                value={formData.txt_Account_Holder}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                name="txt_Account_Number"
                className="form-control"
                placeholder="Bank Account Number"
                value={formData.txt_Account_Number}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input
                type="text"
                name="txt_IFSC_Code"
                className="form-control"
                placeholder="SBIN0001234"
                value={formData.txt_IFSC_Code}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                type="text"
                name="txt_UPI_ID"
                className="form-control"
                placeholder="username@upi"
                value={formData.txt_UPI_ID}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* Section 5: Delivery Information */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
            <Truck size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Delivery Information</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Delivery Area *</label>
              <input
                type="text"
                name="txt_Delivery_Area"
                className="form-control"
                required
                placeholder="e.g. City-wide / North Zone / All Hostels"
                value={formData.txt_Delivery_Area}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Time</label>
              <select
                name="txt_Delivery_Time"
                className="form-control"
                value={formData.txt_Delivery_Time}
                onChange={handleChange}
              >
                <option value="Within 24 Hours">Within 24 Hours</option>
                <option value="24 - 48 Hours">24 - 48 Hours</option>
                <option value="3 - 5 Days">3 - 5 Days</option>
                <option value="Within 7 Days">Within 7 Days</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Minimum Order Value (₹) <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-secondary)' }}>(Optional)</span></label>
              <input
                type="number"
                name="dec_Min_Order_Value"
                className="form-control"
                placeholder="e.g. 5000 (Optional)"
                value={formData.dec_Min_Order_Value}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select
                name="txt_Payment_Terms"
                className="form-control"
                value={formData.txt_Payment_Terms}
                onChange={handleChange}
              >
                <option value="Cash">Cash</option>
                <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Advance Payment">Advance Payment</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Form Footer Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginBottom: '40px' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '0.95rem', fontWeight: 600 }}
          >
            <Save size={18} />
            <span>{loading ? 'Saving Changes...' : 'Save Supplier Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
