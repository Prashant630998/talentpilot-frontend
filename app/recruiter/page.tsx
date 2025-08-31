"use client";
import { useState } from "react";

export default function RecruiterPage() {
  const [jd, setJd] = useState("");
  const [booleanResult, setBooleanResult] = useState("");
  const [qaResult, setQaResult] = useState<any[]>([]);
  const [history, setHistory] = useState<{ boolean?: string; qa?: any[] }[]>([]);
  const [rateTemplate, setRateTemplate] = useState("");
  const [submission, setSubmission] = useState({
    name: "",
    email: "",
    contact: "",
    education: "",
    location: "",
    notice: "",
  });

  const generateBoolean = async () => {
    const resp = await fetch("/api/generateBoolean", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd }),
    });
    const data = await resp.json();
    setBooleanResult(data.boolean || JSON.stringify(data));
    setHistory((h) => [{ boolean: data.boolean }, ...h].slice(0, 10));
  };

  const generateQA = async () => {
    const resp = await fetch("/api/screening", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd }),
    });
    const data = await resp.json();
    setQaResult(data.qa || []);
    setHistory((h) => [{ qa: data.qa }, ...h].slice(0, 10));
  };

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">TalentPilot – Recruiter Tools</h1>
      <p className="text-sm text-gray-600">Paste your JD below, then generate.</p>

      {/* JD Input */}
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        className="w-full h-40 p-3 border rounded"
        placeholder="Paste your job description here…"
      />

      <div className="flex gap-2">
        <button
          onClick={generateBoolean}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Generate Boolean
        </button>
        <button
          onClick={generateQA}
          className="px-4 py-2 rounded bg-gray-200"
        >
          Generate Q&A
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Boolean Result */}
        <div className="border p-3 rounded">
          <h2 className="font-semibold mb-2">Boolean Result</h2>
          <textarea
            className="w-full h-32 border p-2"
            value={booleanResult}
            readOnly
          />
        </div>

        {/* Screening Q&A */}
        <div className="border p-3 rounded">
          <h2 className="font-semibold mb-2">Screening Q&A</h2>
          <pre className="text-sm whitespace-pre-wrap">
            {qaResult.slice(0, 3).map((q, i) => `${i + 1}. ${q.q}\nAns: ${q.a}\n\n`)}
          </pre>
        </div>

        {/* History */}
        <div className="border p-3 rounded">
          <h2 className="font-semibold mb-2">History (last 10)</h2>
          {history.map((h, i) => (
            <div key={i} className="mb-2 text-xs">
              {h.boolean && <div>Boolean: {h.boolean.slice(0, 50)}...</div>}
              {h.qa && <div>Q&A: {h.qa[0]?.q}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Rate Confirmation Template */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Rate Confirmation Template</h2>
        <textarea
          value={rateTemplate}
          onChange={(e) => setRateTemplate(e.target.value)}
          className="w-full h-28 border p-2"
          placeholder="Write or customize your rate confirmation template here…"
        />
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded bg-blue-500 text-white">
            Save Template
          </button>
          <button
            onClick={() => {
              const mailto = `mailto:?subject=Rate Confirmation&body=${encodeURIComponent(
                rateTemplate
              )}`;
              window.location.href = mailto;
            }}
            className="px-3 py-1 rounded bg-green-500 text-white"
          >
            Share via Email
          </button>
        </div>
      </div>

      {/* Submission Template */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Submission Template</h2>
        <input
          placeholder="Candidate Name"
          className="w-full border p-2"
          value={submission.name}
          onChange={(e) => setSubmission({ ...submission, name: e.target.value })}
        />
        <input
          placeholder="Email"
          className="w-full border p-2"
          value={submission.email}
          onChange={(e) =>
            setSubmission({ ...submission, email: e.target.value })
          }
        />
        <input
          placeholder="Contact"
          className="w-full border p-2"
          value={submission.contact}
          onChange={(e) =>
            setSubmission({ ...submission, contact: e.target.value })
          }
        />
        <input
          placeholder="Education/Year"
          className="w-full border p-2"
          value={submission.education}
          onChange={(e) =>
            setSubmission({ ...submission, education: e.target.value })
          }
        />
        <input
          placeholder="Location + Zip"
          className="w-full border p-2"
          value={submission.location}
          onChange={(e) =>
            setSubmission({ ...submission, location: e.target.value })
          }
        />
        <input
          placeholder="Notice Period"
          className="w-full border p-2"
          value={submission.notice}
          onChange={(e) =>
            setSubmission({ ...submission, notice: e.target.value })
          }
        />
        <button
          className="px-3 py-1 rounded bg-purple-500 text-white"
          onClick={() => {
            const content = `
Candidate Name: ${submission.name}
Email: ${submission.email}
Contact: ${submission.contact}
Education: ${submission.education}
Location: ${submission.location}
Notice Period: ${submission.notice}
`;
            alert("Submission Template Saved:\n\n" + content);
          }}
        >
          Save Submission
        </button>
      </div>
    </main>
  );
}
