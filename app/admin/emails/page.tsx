"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EmailTemplate } from "@/lib/types";

const TEMPLATE_INFO: Record<string, { title: string; description: string; variables: string[] }> = {
  mailing_list_welcome: {
    title: "Mailing list welcome email",
    description: "Sent automatically the moment someone signs up on the site.",
    variables: ["{{name}}", "{{email}}"],
  },
  booking_confirmation: {
    title: "Booking confirmation email",
    description: "Sent automatically the moment someone books an appointment.",
    variables: ["{{name}}", "{{service}}", "{{date}}", "{{time}}"],
  },
};

export default function AdminEmailsPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Test email diagnostic state
  const [testEmail, setTestEmail] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<unknown>(null);

  async function sendTestEmail() {
    setTestStatus("sending");
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail || undefined }),
      });
      const data = await res.json();
      setTestResult(data);
      setTestStatus(res.ok ? "success" : "error");
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : String(err) });
      setTestStatus("error");
    }
  }

  useEffect(() => {
    supabase
      .from("email_templates")
      .select("*")
      .then(({ data }) => {
        setTemplates(data ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(template: EmailTemplate) {
    setSavingKey(template.template_key);
    await supabase
      .from("email_templates")
      .update({ subject: template.subject, body_html: template.body_html })
      .eq("id", template.id);
    setSavingKey(null);
  }

  if (loading) return <p className="text-plum/70">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl text-plum">Email Templates</h1>
      <p className="mt-2 text-plum/70">
        These are sent automatically from your Gmail address. Basic HTML tags (like{" "}
        <code>&lt;p&gt;</code>, <code>&lt;strong&gt;</code>) work in the body.
      </p>

      <div className="mt-8 rounded-2xl bg-white/70 p-6">
        <h2 className="font-display text-xl text-mauve">Send a test email</h2>
        <p className="mt-1 text-sm text-plum/70">
          Sends a real test email using your Gmail settings and shows the exact result here — handy for
          checking your setup without digging through Netlify logs.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="email"
            placeholder="Send to (leave blank to use your Gmail address)"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 rounded-full border border-rose bg-white px-4 py-2 text-plum placeholder:text-plum/40 focus:border-glow focus:outline-none"
          />
          <button
            onClick={sendTestEmail}
            disabled={testStatus === "sending"}
            className="rounded-full bg-plum px-6 py-2 text-blush transition-colors hover:bg-glow disabled:opacity-60"
          >
            {testStatus === "sending" ? "Sending…" : "Send test email"}
          </button>
        </div>
        {testStatus === "success" && (
          <p className="mt-3 text-sm text-green-700">
            ✓ Sent successfully. Check the inbox in a minute or two.
          </p>
        )}
        {testResult != null && (
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-plum/5 p-4 text-xs text-plum">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </div>

      <div className="mt-8 space-y-10">
        {templates.map((template) => {
          const info = TEMPLATE_INFO[template.template_key];
          return (
            <div key={template.id} className="rounded-2xl bg-white/70 p-6">
              <h2 className="font-display text-xl text-mauve">{info?.title ?? template.template_key}</h2>
              <p className="mt-1 text-sm text-plum/70">{info?.description}</p>
              <p className="mt-1 text-xs text-plum/50">
                Available placeholders: {info?.variables.join(", ")}
              </p>

              <label className="mt-4 block text-sm text-plum">Subject</label>
              <input
                type="text"
                value={template.subject}
                onChange={(e) =>
                  setTemplates((prev) =>
                    prev.map((t) => (t.id === template.id ? { ...t, subject: e.target.value } : t))
                  )
                }
                className="mt-1 w-full rounded-full border border-rose bg-white px-4 py-2 text-plum focus:border-glow focus:outline-none"
              />

              <label className="mt-4 block text-sm text-plum">Body (HTML)</label>
              <textarea
                rows={8}
                value={template.body_html}
                onChange={(e) =>
                  setTemplates((prev) =>
                    prev.map((t) => (t.id === template.id ? { ...t, body_html: e.target.value } : t))
                  )
                }
                className="mt-1 w-full rounded-2xl border border-rose bg-white px-4 py-2 font-mono text-sm text-plum focus:border-glow focus:outline-none"
              />

              <button
                onClick={() => save(template)}
                disabled={savingKey === template.template_key}
                className="mt-4 rounded-full bg-plum px-6 py-2 text-blush transition-colors hover:bg-glow disabled:opacity-60"
              >
                {savingKey === template.template_key ? "Saving…" : "Save template"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
