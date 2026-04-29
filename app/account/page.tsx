"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../components/AppLayout";
import { supabaseBrowser } from "@/lib/supabase/client";

type Profile = {
  full_name: string;
  role: string;
};

const EMPTY_PROFILE: Profile = {
  full_name: "",
  role: "",
};

export default function AccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAuth, setSavingAuth] = useState(false);
  const [sendingPasswordCode, setSendingPasswordCode] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNonce, setPasswordNonce] = useState("");
  const [passwordCodeSent, setPasswordCodeSent] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? "";
      setToken(accessToken);

      const res = await fetch("/api/account", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to load account.");
        setLoading(false);
        return;
      }

      setEmail(json.email ?? "");
      setProfile({
        full_name: json.profile?.full_name ?? "",
        role: json.profile?.role ?? "",
      });
      setLoading(false);
    }

    load();
  }, [router, supabase]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/account", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Failed to update profile.");
      setSavingProfile(false);
      return;
    }

    setProfile({
      full_name: json.profile?.full_name ?? "",
      role: json.profile?.role ?? "",
    });
    setMessage("Profile updated successfully.");
    setSavingProfile(false);
  }

  async function saveAuthChanges(e: FormEvent) {
    e.preventDefault();
    setSavingAuth(true);
    setError("");
    setMessage("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSavingAuth(false);
      return;
    }

    const payload: { password?: string } = {};
    if (newPassword) payload.password = newPassword;

    if (!payload.password) {
      setError("Enter a new password to update it.");
      setSavingAuth(false);
      return;
    }

    if (!passwordNonce.trim()) {
      setError("Enter the verification code sent to your email before changing your password.");
      setSavingAuth(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      ...payload,
      nonce: passwordNonce.trim(),
    });
    if (authError) {
      setError(authError.message);
      setSavingAuth(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordNonce("");
    setPasswordCodeSent(false);
    setMessage("Password updated successfully.");
    setSavingAuth(false);
  }

  async function sendPasswordVerificationCode() {
    setSendingPasswordCode(true);
    setError("");
    setMessage("");

    const { error: authError } = await supabase.auth.reauthenticate();
    if (authError) {
      setError(authError.message);
      setSendingPasswordCode(false);
      return;
    }

    setPasswordCodeSent(true);
    setMessage("A verification code was sent to your email. Enter it below to finish changing your password.");
    setSendingPasswordCode(false);
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F5A623]">Account</p>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update your full name and password.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-sm text-gray-500">
            Loading account details...
          </div>
        ) : (
          <div className="space-y-6">
            {(message || error) && (
              <div
                className="px-4 py-3 rounded-lg text-sm border"
                style={{
                  background: error ? "#FEF2F2" : "#F0FDF4",
                  color: error ? "#B91C1C" : "#166534",
                  borderColor: error ? "#FECACA" : "#BBF7D0",
                }}
              >
                {error || message}
              </div>
            )}

            <form onSubmit={saveProfile} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <label className="text-sm text-gray-600">
                  Full Name
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={profile.full_name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Role
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    value={profile.role}
                    disabled
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-lg bg-[#1B2A6B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>

            <form onSubmit={saveAuthChanges} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900">Login & Security</h2>
              <p className="mt-2 text-sm text-gray-500">
                To change your password, request a verification code and enter the code sent to your email.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <label className="text-sm text-gray-600 md:col-span-2">
                  Email Address
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    value={email}
                    disabled
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={sendPasswordVerificationCode}
                    disabled={sendingPasswordCode}
                    className="rounded-lg border border-[#1B2A6B] px-4 py-2.5 text-sm font-bold text-[#1B2A6B] disabled:opacity-60"
                  >
                    {sendingPasswordCode ? "Sending code..." : "Send Verification Code"}
                  </button>
                </div>
                <label className="text-sm text-gray-600 md:col-span-2">
                  Verification Code
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={passwordNonce}
                    onChange={(e) => setPasswordNonce(e.target.value)}
                    placeholder="Enter the code sent to your email"
                  />
                  {passwordCodeSent && (
                    <span className="mt-1 block text-xs text-gray-500">
                      Check your inbox for the latest password verification code from Supabase.
                    </span>
                  )}
                </label>
                <label className="text-sm text-gray-600">
                  New Password
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Confirm New Password
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat the new password"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingAuth}
                  className="rounded-lg bg-[#F5A623] px-5 py-2.5 text-sm font-bold text-[#0F1A4A] disabled:opacity-60"
                >
                  {savingAuth ? "Saving..." : "Update Login Details"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
