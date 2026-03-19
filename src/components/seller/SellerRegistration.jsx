import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  User,
  IdCard,
  ShieldCheck,
  Banknote,
  KeyRound,
  LogIn,
} from "lucide-react";
import { SHIPPING_METHODS, DELIVERY_OPTIONS } from "../../utils/constants";
import { API_BASE_URL } from "../../utils/api";
import { setSellerSession } from "../../utils/sellerSession";

const DEMO_OTP = "123456";

const generatePasswordValue = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  let password = "";
  for (let i = 0; i < 12; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};

const SellerRegistration = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSellerLoginLoading, setIsSellerLoginLoading] = useState(false);
  const [sellerLoginError, setSellerLoginError] = useState("");

  const [kyc, setKyc] = useState({
    aadhaar: "",
    pan: "",
    phone: "",
  });

  const [details, setDetails] = useState({
    storeName: "",
    email: "",
    address: "",
    shippingMethod: SHIPPING_METHODS.STANDARD,
    deliveryOption: DELIVERY_OPTIONS.PAID,
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    sellerPassword: "",
  });

  const [sellerLogin, setSellerLogin] = useState({
    storeName: "",
    password: "",
  });

  const fieldShellClass =
    "flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 bg-white focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200/70 transition";
  const fieldInputClass =
    "w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500 caret-slate-900";
  const standaloneInputClass =
    "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/70";
  const selectInputClass =
    "w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/70";

  const handleKycChange = (e) => {
    setKyc({ ...kyc, [e.target.name]: e.target.value });
  };

  const handleDetailsChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSellerLoginInput = (e) => {
    setSellerLogin({ ...sellerLogin, [e.target.name]: e.target.value });
    setSellerLoginError("");
  };

  const handleGeneratePassword = () => {
    const generated = generatePasswordValue();
    setDetails((prev) => ({ ...prev, sellerPassword: generated }));
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!kyc.phone || kyc.phone.length < 10) return;

    setStep(2);
    setOtpError("");

    alert(`Demo OTP: ${DEMO_OTP}\n\n(In production this is sent to ${kyc.phone}).`);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (enteredOtp === DEMO_OTP) {
      setOtpError("");
      setStep(3);
    } else {
      setOtpError("Incorrect OTP. Try 123456 for demo.");
    }
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    setError("");

    if (!details.sellerPassword || details.sellerPassword.length < 8) {
      setError("Seller password must be at least 8 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/api/seller-auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: details.storeName,
          sellerEmail: details.email,
          phone: kyc.phone,
          password: details.sellerPassword,
          address: details.address,
          shippingMethod: details.shippingMethod,
          deliveryOption: details.deliveryOption,
          accountHolder: details.accountHolder,
          accountNumber: details.accountNumber,
          ifsc: details.ifsc,
          aadhaar: kyc.aadhaar,
          pan: kyc.pan,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Failed to create seller account");
      }

      setSellerSession(data.seller);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("sellerEntryIntent");
      }

      alert("Seller account created. Use store name + password to login from any device.");
      navigate("/seller-listing");
    } catch (submitError) {
      setError(submitError.message || "Failed to create seller account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSellerLogin = async (e) => {
    e.preventDefault();
    setSellerLoginError("");

    try {
      setIsSellerLoginLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/seller-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: sellerLogin.storeName,
          password: sellerLogin.password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Seller login failed");
      }

      setSellerSession(data.seller);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("sellerEntryIntent");
      }
      navigate("/seller-listing");
    } catch (loginError) {
      setSellerLoginError(loginError.message || "Seller login failed");
    } finally {
      setIsSellerLoginLoading(false);
    }
  };

  return (
    <div className="seller-auth-screen min-h-screen p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-xl rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Thrift Seller Registration</h1>
              <p className="text-xs text-gray-500">Step {step} of 3 • KYC, OTP, store, and password</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <div className={`flex-1 flex items-center gap-2 ${step >= 1 ? "text-purple-600" : "text-gray-400"}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center border border-current">1</span>
              <span>KYC & Phone</span>
            </div>
            <div className={`flex-1 flex items-center justify-center gap-2 ${step >= 2 ? "text-purple-600" : "text-gray-400"}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center border border-current">2</span>
              <span>OTP Verify</span>
            </div>
            <div className={`flex-1 flex items-center justify-end gap-2 ${step >= 3 ? "text-purple-600" : "text-gray-400"}`}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center border border-current">3</span>
              <span>Store & Bank</span>
            </div>
          </div>

          {step === 1 && (
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Aadhaar Number</label>
                <div className={fieldShellClass}>
                  <IdCard className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="aadhaar"
                    pattern="[0-9]{12}"
                    required
                    placeholder="12 digit Aadhaar"
                    value={kyc.aadhaar}
                    onChange={handleKycChange}
                    className={fieldInputClass}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600">PAN Number</label>
                <input
                  type="text"
                  name="pan"
                  required
                  placeholder="ABCDE1234F"
                  value={kyc.pan}
                  onChange={handleKycChange}
                  className={standaloneInputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600">Phone (OTP will be sent)</label>
                <div className={fieldShellClass}>
                  <Phone className="w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    pattern="[0-9]{10}"
                    required
                    placeholder="10 digit number"
                    value={kyc.phone}
                    onChange={handleKycChange}
                    className={fieldInputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition"
              >
                Send OTP
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <p className="text-sm text-gray-600">
                OTP sent to <span className="font-semibold">{kyc.phone}</span>. Demo OTP:{" "}
                <span className="font-mono font-bold">123456</span>.
              </p>

              <div className="space-y-1">
                <label className="text-sm text-gray-600">Enter OTP</label>
                <input
                  type="text"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className={`${standaloneInputClass} tracking-widest text-center font-mono`}
                  placeholder="••••••"
                />
              </div>

              {otpError && <p className="text-xs text-red-500">{otpError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-xl font-semibold text-sm"
                >
                  Verify OTP
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form className="space-y-4" onSubmit={handleFinish}>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Store Name (used for seller login)</label>
                <div className={fieldShellClass}>
                  <User className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="storeName"
                    required
                    placeholder="Your thrift store name"
                    value={details.storeName}
                    onChange={handleDetailsChange}
                    className={fieldInputClass}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600">Seller Email</label>
                <div className={fieldShellClass}>
                  <Mail className="w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="store@email.com"
                    value={details.email}
                    onChange={handleDetailsChange}
                    className={fieldInputClass}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600">Pickup Address</label>
                <div className={fieldShellClass}>
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="Full pickup address"
                    value={details.address}
                    onChange={handleDetailsChange}
                    className={fieldInputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">Preferred shipping</label>
                  <select
                    name="shippingMethod"
                    value={details.shippingMethod}
                    onChange={handleDetailsChange}
                    className={selectInputClass}
                  >
                    {Object.values(SHIPPING_METHODS).map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">Delivery charges</label>
                  <select
                    name="deliveryOption"
                    value={details.deliveryOption}
                    onChange={handleDetailsChange}
                    className={selectInputClass}
                  >
                    <option value={DELIVERY_OPTIONS.FREE}>I will offer free delivery</option>
                    <option value={DELIVERY_OPTIONS.PAID}>Buyer pays delivery</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600">Bank account holder</label>
                <div className={fieldShellClass}>
                  <Banknote className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="accountHolder"
                    required
                    placeholder="Name on bank account"
                    value={details.accountHolder}
                    onChange={handleDetailsChange}
                    className={fieldInputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">Account number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    required
                    placeholder="XXXXXXXXXXXX"
                    value={details.accountNumber}
                    onChange={handleDetailsChange}
                    className={standaloneInputClass}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-sm text-gray-600">IFSC</label>
                  <input
                    type="text"
                    name="ifsc"
                    required
                    placeholder="SBIN000000"
                    value={details.ifsc}
                    onChange={handleDetailsChange}
                    className={standaloneInputClass}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600">Seller Password</label>
                <div className="flex gap-2">
                  <div className={`${fieldShellClass} flex-1`}>
                    <KeyRound className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="sellerPassword"
                      required
                      minLength={8}
                      placeholder="Set a strong password"
                      value={details.sellerPassword}
                      onChange={handleDetailsChange}
                      className={fieldInputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-4 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Save this password. Use Store Name + Password to login from any device.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-start gap-2 text-xs bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 mt-0.5" />
                <p className="text-[11px] text-purple-900">
                  Seller credentials are stored on backend for cross-device login.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-xl font-semibold text-sm disabled:opacity-70"
                >
                  {isSubmitting ? "Creating..." : "Complete Registration"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white shadow-xl rounded-3xl p-6 space-y-5 h-fit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Thrift Seller Login</h2>
              <p className="text-xs text-gray-500">Login using store name and seller password</p>
            </div>
          </div>

          <form onSubmit={handleSellerLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Store Name</label>
              <input
                type="text"
                name="storeName"
                required
                value={sellerLogin.storeName}
                onChange={handleSellerLoginInput}
                placeholder="Your thrift store name"
                className={standaloneInputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                name="password"
                required
                value={sellerLogin.password}
                onChange={handleSellerLoginInput}
                placeholder="Seller password"
                className={standaloneInputClass}
              />
            </div>

            {sellerLoginError && <p className="text-sm text-red-600">{sellerLoginError}</p>}

            <button
              type="submit"
              disabled={isSellerLoginLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-70"
            >
              {isSellerLoginLoading ? "Logging in..." : "Login as Seller"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerRegistration;
