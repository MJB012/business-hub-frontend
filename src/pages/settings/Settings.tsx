import { useState, useRef, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import {
  Bell,
  Settings as SettingsIcon,
  AlertTriangle,
  Upload,
  Store,
  Check,
  RotateCcw,
  Pencil,
  Lock,
} from 'lucide-react';
import BaseInput from '../../components/base-input/BaseInput';
import { UserRoleEnum } from '../../enums/UserRoleEnum';
import { ShopSettingsEntity } from '../../components/entities/shop_settings.entity';
import { businessService } from '../../services/business.service';
import { setStoredCurrency } from '../../services/currency.service';

const DEFAULT_SETTINGS = new ShopSettingsEntity();

const BUSINESS_TYPE_OPTIONS = [
  { value: 'Retail & POS', label: 'Retail & POS' },
  { value: 'Wholesale & Distribution', label: 'Wholesale & Distribution' },
  { value: 'E-Commerce & Digital', label: 'E-Commerce & Digital' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Services & Consulting', label: 'Services & Consulting' },
  { value: 'Restaurant & Hospitality', label: 'Restaurant & Hospitality' },
  { value: 'Other', label: 'Other' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD ($)', label: 'USD ($)' },
  { value: 'EUR (€)', label: 'EUR (€)' },
  { value: 'GBP (£)', label: 'GBP (£)' },
  { value: 'PKR (Rs)', label: 'PKR (Rs)' },
  { value: 'CAD ($)', label: 'CAD ($)' },
  { value: 'AUD ($)', label: 'AUD ($)' },
];

const getPrefilledGeneralSettings = (): ShopSettingsEntity => {
  try {
    const storedShop = localStorage.getItem('shop_settings');
    const storedUser = localStorage.getItem('user');
    const parsedShop = storedShop ? JSON.parse(storedShop) : {};
    const parsedUser = storedUser ? JSON.parse(storedUser) : {};

    const entity = new ShopSettingsEntity();
    entity.shop_name =
      parsedShop.shop_name ||
      parsedShop.shopName ||
      parsedUser.business_name ||
      parsedUser.businessName ||
      DEFAULT_SETTINGS.shop_name;
    entity.shop_logo =
      parsedShop.shop_logo !== undefined
        ? parsedShop.shop_logo
        : parsedShop.shopLogo !== undefined
        ? parsedShop.shopLogo
        : DEFAULT_SETTINGS.shop_logo;
    entity.business_type =
      parsedShop.business_type ||
      parsedShop.businessType ||
      parsedUser.business_type ||
      parsedUser.businessType ||
      DEFAULT_SETTINGS.business_type;
    entity.contact_email =
      parsedShop.contact_email ||
      parsedShop.contactEmail ||
      parsedUser.email ||
      DEFAULT_SETTINGS.contact_email;
    entity.contact_phone =
      parsedShop.contact_phone ||
      parsedShop.contactPhone ||
      parsedUser.phone ||
      parsedUser.contactPhone ||
      DEFAULT_SETTINGS.contact_phone;
    entity.currency =
      parsedShop.currency ||
      parsedUser.business?.currency ||
      parsedUser.currency ||
      DEFAULT_SETTINGS.currency;
    entity.address =
      parsedShop.address ||
      parsedUser.address ||
      DEFAULT_SETTINGS.address;
    entity.low_stock_threshold =
      parsedShop.low_stock_threshold !== undefined
        ? Number(parsedShop.low_stock_threshold)
        : DEFAULT_SETTINGS.low_stock_threshold;

    return entity;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export default function Settings() {
  // Inventory Alerts Settings State
  const [threshold, setThreshold] = useState<number>(10);
  const [savedThreshold, setSavedThreshold] = useState<number>(10);
  const [alertSuccess, setAlertSuccess] = useState(false);

  // User Role & Permissions (Super Admin check)
  const [currentUserRole, setCurrentUserRole] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.role || 'admin';
      }
    } catch {
      // fallback
    }
    return 'admin';
  });

  const isSuperAdmin =
    currentUserRole === UserRoleEnum.SUPER_ADMIN || currentUserRole === 'super_admin';

  // General Settings State using ShopSettingsEntity
  const [generalSettings, setGeneralSettings] = useState<ShopSettingsEntity>(
    getPrefilledGeneralSettings
  );
  const [savedSettings, setSavedSettings] = useState<ShopSettingsEntity>(
    getPrefilledGeneralSettings
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [generalSuccess, setGeneralSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved threshold and prefill settings from backend & localStorage when component mounts
  useEffect(() => {
    try {
      const storedThreshold = localStorage.getItem('low_stock_threshold');
      if (storedThreshold) {
        const val = Number(storedThreshold);
        setThreshold(val);
        setSavedThreshold(val);
      }

      const prefilled = getPrefilledGeneralSettings();
      setGeneralSettings(prefilled);
      setSavedSettings(prefilled);
      setThreshold(prefilled.low_stock_threshold);
      setSavedThreshold(prefilled.low_stock_threshold);

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.role) {
          setCurrentUserRole(parsed.role);
        }
      }
    } catch {
      // fallback
    }

    // Attempt to fetch live business info from backend
    const fetchLiveBusiness = async () => {
      try {
        const live = await businessService.getCurrentBusiness();
        if (live) {
          setGeneralSettings((prev) => {
            const next = {
              ...prev,
              shop_name: live.name || prev.shop_name,
              business_type: live.type || prev.business_type,
              shop_logo: live.logo !== undefined ? live.logo : prev.shop_logo,
              contact_email: live.contact_email || prev.contact_email,
              contact_phone: live.contact_phone || prev.contact_phone,
              currency: live.currency || prev.currency,
              address: live.address || prev.address,
              low_stock_threshold:
                live.low_stock_threshold !== undefined
                  ? live.low_stock_threshold
                  : prev.low_stock_threshold,
            };
            setSavedSettings(next);
            localStorage.setItem('shop_settings', JSON.stringify(next));
            if (next.currency) {
              setStoredCurrency(next.currency);
            }
            return next;
          });
        }
      } catch (err) {
        console.warn('Backend business settings fetch failed, using local settings:', err);
      }
    };

    fetchLiveBusiness();
  }, []);

  // Listen for storage events (e.g. from other tabs or components)
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const prefilled = getPrefilledGeneralSettings();
        setSavedSettings(prefilled);
        if (!isEditing) {
          setGeneralSettings(prefilled);
        }
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role) {
            setCurrentUserRole(parsed.role);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, [isEditing]);

  // Handle Inventory Alerts Save
  const handleSaveAlerts = async (e: FormEvent) => {
    e.preventDefault();
    setSavedThreshold(threshold);
    try {
      localStorage.setItem('low_stock_threshold', threshold.toString());

      // Also persist to shop_settings
      const updated = { ...generalSettings, low_stock_threshold: threshold };
      localStorage.setItem('shop_settings', JSON.stringify(updated));
      await businessService.updateCurrentBusiness({ low_stock_threshold: threshold });
    } catch {
      // ignore
    }
    setAlertSuccess(true);
    setTimeout(() => setAlertSuccess(false), 3000);
  };

  // Handle Inventory Alerts Reset
  const handleResetAlerts = () => {
    setThreshold(10);
    setSavedThreshold(10);
    try {
      localStorage.setItem('low_stock_threshold', '10');
      const updated = { ...generalSettings, low_stock_threshold: 10 };
      localStorage.setItem('shop_settings', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneralSettings((prev) => ({
          ...prev,
          shop_logo: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setGeneralSettings((prev) => ({
      ...prev,
      shop_logo: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setGeneralSettings(savedSettings);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle General Settings Save
  const handleSaveGeneral = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // 1. Save to backend if available
      await businessService.updateCurrentBusiness(generalSettings);
    } catch (err) {
      console.warn('Backend update business failed, saving locally:', err);
    }

    try {
      // 2. Persist to localStorage with snake_case
      localStorage.setItem('shop_settings', JSON.stringify(generalSettings));

      // 3. Sync business_name and business_type in stored user
      const storedUser = localStorage.getItem('user');
      const userObj = storedUser ? JSON.parse(storedUser) : {};
      userObj.business_name = generalSettings.shop_name;
      if (isSuperAdmin) {
        userObj.business_type = generalSettings.business_type;
      }
      localStorage.setItem('user', JSON.stringify(userObj));

      // 4. Notify other components via storage event (updates Sidebar & Currency dynamically)
      if (generalSettings.currency) {
        setStoredCurrency(generalSettings.currency);
      } else {
        window.dispatchEvent(new Event('storage'));
      }
    } catch {
      // ignore
    }

    setSavedSettings(generalSettings);
    setIsEditing(false);
    setGeneralSuccess(true);
    setTimeout(() => setGeneralSuccess(false), 3000);
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your business preferences and notifications
        </p>
      </div>

      {/* 1. Inventory Alerts Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Bell size={20} className="text-gray-900" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Inventory Alerts
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Manage notifications for low stock levels
              </p>
            </div>
          </div>

          {alertSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check size={14} /> Saved
            </span>
          )}
        </div>

        {/* Threshold Input */}
        <form onSubmit={handleSaveAlerts} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
              className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              You&apos;ll be notified when product quantity falls below this number
            </p>
          </div>

          {/* Yellow/Amber Warning Alert Box */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-amber-600 shrink-0 mt-0.5"
            />
            <div className="text-sm">
              <span className="font-semibold text-amber-900 block leading-tight">
                Low Stock Alert
              </span>
              <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-snug">
                Current threshold:{' '}
                <span className="font-bold text-amber-950">
                  {savedThreshold} units
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-black text-white hover:bg-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={handleResetAlerts}
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={14} className="text-gray-500" />
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* 2. General Settings Card (Shop Settings) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header - Single Edit Settings button on top right */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SettingsIcon size={20} className="text-gray-900 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                General Settings
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Configure shop details, branding, and contact preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {generalSuccess && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check size={14} /> Saved
              </span>
            )}

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-black text-white hover:bg-gray-800 transition cursor-pointer shadow-xs"
              >
                <Pencil size={14} />
                <span>Edit Settings</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Editing Mode
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Shop Settings Form */}
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          {/* Shop Logo Section */}
          <div className="border-b border-gray-100 pb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Shop Logo
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Logo Preview */}
              <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-white overflow-hidden shadow-xs shrink-0 border border-gray-200">
                {generalSettings.shop_logo ? (
                  <img
                    src={generalSettings.shop_logo}
                    alt="Shop Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store size={28} className="text-white" />
                )}
              </div>

              {/* Upload & Remove Controls */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                    id="logo-upload-input"
                    disabled={!isEditing}
                  />
                  <button
                    type="button"
                    onClick={() => isEditing && fileInputRef.current?.click()}
                    disabled={!isEditing}
                    className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition ${
                      isEditing
                        ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
                        : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <Upload size={16} />
                    <span>Upload Logo</span>
                  </button>

                  {isEditing && generalSettings.shop_logo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {isEditing
                    ? 'Recommended: PNG or JPG, max 2MB. Displayed in sidebar and invoices.'
                    : 'Click "Edit Settings" to change your store logo.'}
                </p>
              </div>
            </div>
          </div>

          {/* Shop Name & Business Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput
              name="shop_name"
              label="Shop Name"
              required
              placeholder="Enter shop name"
              value={generalSettings.shop_name}
              disabled={!isEditing}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  shop_name: e.target.value,
                }))
              }
            />

            {/* Business Type: Disabled for regular owners; only Super Admin can change on request */}
            <BaseInput
              name="business_type"
              label={
                <span className="flex items-center justify-between w-full">
                  <span>Business Type</span>
                  {!isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </span>
              }
              type="select"
              value={generalSettings.business_type}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  business_type: e.target.value,
                }))
              }
              options={BUSINESS_TYPE_OPTIONS}
              disabled={!isEditing || !isSuperAdmin}
              helperText={
                !isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
                    <Lock size={11} className="shrink-0" />
                    Only Super Admin can change this on request
                  </span>
                ) : undefined
              }
            />
          </div>

          {/* Contact Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput
              name="contact_email"
              label="Contact Email"
              type="email"
              placeholder="shop@example.com"
              value={generalSettings.contact_email}
              disabled={!isEditing}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  contact_email: e.target.value,
                }))
              }
            />

            <BaseInput
              name="contact_phone"
              label="Contact Phone"
              type="tel"
              placeholder="+1 555-0199"
              value={generalSettings.contact_phone}
              disabled={!isEditing}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  contact_phone: e.target.value,
                }))
              }
            />
          </div>

          {/* Currency Preference & Shop Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput
              name="currency"
              label="Default Currency"
              type="select"
              value={generalSettings.currency}
              disabled={!isEditing}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  currency: e.target.value,
                }))
              }
              options={CURRENCY_OPTIONS}
            />

            <BaseInput
              name="address"
              label="Physical Address"
              placeholder="Enter store/shop address"
              value={generalSettings.address}
              disabled={!isEditing}
              onChange={(e) =>
                setGeneralSettings((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
            />
          </div>

          {/* Action Buttons at bottom of card - only displayed in Edit Mode */}
          {isEditing && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-black text-white hover:bg-gray-800 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Check size={16} />
                <span>Save General Settings</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
