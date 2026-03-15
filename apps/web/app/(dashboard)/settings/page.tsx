'use client';

import { useAuth } from '../../../contexts/auth-context';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-[#E2E4DE] bg-[#F7F8F6] text-[#1A1D1F] placeholder:text-[#6B7280] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow opacity-60 cursor-not-allowed';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A1D1F]">Settings</h1>
        <p className="text-[#6B7280] text-sm mt-1">Manage system and account settings</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] p-6">
          <h2 className="text-sm font-bold text-[#1A1D1F] mb-5">General</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Clinic Name</label>
                <input type="text" value="CareQueue Clinic" disabled className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Timezone</label>
                <input type="text" value={Intl.DateTimeFormat().resolvedOptions().timeZone} disabled className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Default Slot Duration</label>
                <input type="text" value="30 minutes" disabled className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Working Hours</label>
                <input type="text" value="9:00 AM – 5:00 PM" disabled className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] p-6">
          <h2 className="text-sm font-bold text-[#1A1D1F] mb-5">Account</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Name</label>
                <input type="text" value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} disabled className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Email</label>
                <input type="email" value={user?.email ?? ''} disabled className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Role</label>
              <input type="text" value={user?.role ?? ''} disabled className={inputCls} />
            </div>
          </div>
        </div>

        {/* Notifications Preferences */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] p-6">
          <h2 className="text-sm font-bold text-[#1A1D1F] mb-5">Notification Preferences</h2>
          <div className="space-y-4">
            {[
              { label: 'Email notifications for new appointments', defaultChecked: true },
              { label: 'Email reminders before appointments', defaultChecked: true },
              { label: 'Email notifications for cancellations', defaultChecked: true },
              { label: 'Email notifications for rescheduling', defaultChecked: false },
            ].map((pref) => (
              <label key={pref.label} className="flex items-center gap-3 cursor-not-allowed">
                <input
                  type="checkbox"
                  checked={pref.defaultChecked}
                  disabled
                  className="w-4 h-4 rounded border-[#D1D5DB] text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-[#374151]">{pref.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-teal-900">Configuration is read-only</p>
              <p className="text-sm text-teal-700 mt-0.5">
                These settings are managed at the system level. Contact your administrator to request changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
