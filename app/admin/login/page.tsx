"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blush px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white/70 p-8">
        <h1 className="font-display text-2xl text-plum">Hair by Tanya Admin</h1>

        <div>
          <label htmlFor="email" className="mb-1 block font-body text-sm text-plum">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum focus:border-glow focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block font-body text-sm text-plum">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border border-rose bg-white px-4 py-2 font-body text-plum focus:border-glow focus:outline-none"
          />
        </div>

        {error && (
          <p className="font-body text-sm text-maroon" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-plum px-6 py-2.5 font-display text-blush transition-colors hover:bg-glow disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
