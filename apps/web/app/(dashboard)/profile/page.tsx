'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/auth-context';
import { patientsApi } from '../../../lib/api/patients';
import { doctorsApi } from '../../../lib/api/doctors';
import { useToast } from '../../../components/ui/toast';
import { formatPhone, PHONE_REGEX, PHONE_MESSAGE } from '../../../lib/utils/phone';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-[#E2E4DE] bg-[#F7F8F6] text-[#1A1D1F] placeholder:text-[#6B7280] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  CLINIC_STAFF: 'Clinic Staff',
  DOCTOR: 'Doctor',
  PATIENT: 'Patient',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';

  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile-me'],
    queryFn: () => patientsApi.get('me' as string),
    enabled: isPatient,
  });

  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile-me'],
    queryFn: () => doctorsApi.get('me' as string),
    enabled: isDoctor,
  });

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (isPatient && patientProfile) {
      setPhone(formatPhone((patientProfile as unknown as { phone?: string }).phone ?? ''));
      setAddress((patientProfile as unknown as { address?: string }).address ?? '');
    }
  }, [isPatient, patientProfile]);

  useEffect(() => {
    if (isDoctor && doctorProfile) {
      setPhone(formatPhone((doctorProfile as unknown as { phone?: string }).phone ?? ''));
      setBio((doctorProfile as unknown as { bio?: string }).bio ?? '');
    }
  }, [isDoctor, doctorProfile]);

  const updatePatient = useMutation({
    mutationFn: () => patientsApi.updateMe({ phone, address }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-profile-me'] });
      showToast('Profile updated successfully');
    },
    onError: () => showToast('Failed to update profile', 'error'),
  });

  const updateDoctor = useMutation({
    mutationFn: () => doctorsApi.updateMe({ phone, bio }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-profile-me'] });
      showToast('Profile updated successfully');
    },
    onError: () => showToast('Failed to update profile', 'error'),
  });

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhone(val);
    setPhone(formatted);
    setPhoneError(formatted && !PHONE_REGEX.test(formatted) ? PHONE_MESSAGE : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!PHONE_REGEX.test(phone)) {
      setPhoneError(PHONE_MESSAGE);
      return;
    }
    setPhoneError('');
    if (isPatient) updatePatient.mutate();
    if (isDoctor) updateDoctor.mutate();
  };

  const isPending = updatePatient.isPending || updateDoctor.isPending;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1A1D1F]">My Profile</h1>
        <p className="text-[#6B7280] text-sm mt-1">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Identity card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#E2E4DE] p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <p className="text-lg font-bold text-[#1A1D1F]">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-[#6B7280] mt-0.5">{user?.email}</p>
            <span className="inline-block mt-3 text-xs font-semibold bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
              {roleLabels[user?.role ?? ''] ?? user?.role}
            </span>

            <div className="mt-6 pt-5 border-t border-[#E2E4DE] text-left space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-sm text-[#1A1D1F]">{user?.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-0.5">Status</p>
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Editable details */}
        <div className="lg:col-span-2">
          {(isPatient || isDoctor) && (
            <div className="bg-white rounded-2xl border border-[#E2E4DE] p-6">
              <h2 className="text-sm font-bold text-[#1A1D1F] mb-5">Profile Details</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">First Name</label>
                    <input type="text" value={user?.firstName ?? ''} disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Last Name</label>
                    <input type="text" value={user?.lastName ?? ''} disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`${inputCls}${phoneError ? ' border-rose-400 focus:ring-rose-400' : ''}`}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                  {phoneError && <p className="mt-1 text-xs text-rose-600">{phoneError}</p>}
                </div>

                {isPatient && (
                  <div>
                    <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className={inputCls + ' resize-none'}
                      placeholder="123 Main St, City, State"
                      maxLength={200}
                    />
                    <p className="text-right text-[10px] text-[#9CA3AF] mt-0.5">{address.length}/200</p>
                  </div>
                )}

                {isDoctor && (
                  <div>
                    <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className={inputCls + ' resize-none'}
                      placeholder="Brief professional bio…"
                      maxLength={500}
                    />
                    <p className="text-right text-[10px] text-[#9CA3AF] mt-0.5">{bio.length}/500</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-teal-600 hover:opacity-90 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving…
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!isPatient && !isDoctor && (
            <div className="bg-white rounded-2xl border border-[#E2E4DE] p-6">
              <h2 className="text-sm font-bold text-[#1A1D1F] mb-4">Account Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">First Name</label>
                  <input type="text" value={user?.firstName ?? ''} disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Last Name</label>
                  <input type="text" value={user?.lastName ?? ''} disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Email</label>
                  <input type="email" value={user?.email ?? ''} disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Role</label>
                  <input type="text" value={roleLabels[user?.role ?? ''] ?? user?.role ?? ''} disabled className={inputCls + ' opacity-60 cursor-not-allowed'} />
                </div>
              </div>
              <p className="text-xs text-[#6B7280] mt-4">
                Contact your system administrator to update account details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
