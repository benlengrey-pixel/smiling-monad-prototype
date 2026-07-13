"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ShiftReportPage() {
  const router = useRouter();

  const [participant, setParticipant] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [activities, setActivities] = useState("");
  const [observations, setObservations] = useState("");
  const [followUp, setFollowUp] = useState("");

  return (
    <main className="min-h-screen bg-[#eee6da] px-5 py-6 text-[#211d19] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/office")}
            className="rounded-full bg-white px-5 py-3 text-sm font-medium shadow-sm"
          >
            Back to Office
          </button>

          <p className="text-sm text-[#74695f]">
            Shift Report
          </p>
        </div>

        <section className="rounded-[2rem] bg-white/90 p-6 shadow-[0_18px_55px_rgba(58,43,31,0.12)] sm:p-8">
          <h1 className="text-3xl font-semibold">
            Shift Report
          </h1>

          <p className="mt-2 text-[#74695f]">
            Complete the report, then save or return to the Office.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Participant
              </span>

              <input
                value={participant}
                onChange={(event) => setParticipant(event.target.value)}
                className="w-full rounded-xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none focus:ring-2 focus:ring-[#c6a57d]/40"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">
                Date
              </span>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none focus:ring-2 focus:ring-[#c6a57d]/40"
              />
            </label>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium">
                Summary
              </span>

              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none focus:ring-2 focus:ring-[#c6a57d]/40"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">
                Activities
              </span>

              <textarea
                value={activities}
                onChange={(event) => setActivities(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none focus:ring-2 focus:ring-[#c6a57d]/40"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">
                Observations
              </span>

              <textarea
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none focus:ring-2 focus:ring-[#c6a57d]/40"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">
                Follow-up
              </span>

              <textarea
                value={followUp}
                onChange={(event) => setFollowUp(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-black/10 bg-[#fffdf9] px-4 py-3 outline-none focus:ring-2 focus:ring-[#c6a57d]/40"
              />
            </label>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => router.push("/office")}
              className="rounded-full border border-black/10 bg-white px-6 py-3 font-medium"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                alert("Shift report saved.");
                router.push("/office");
              }}
              className="rounded-full bg-[#6d513a] px-6 py-3 font-medium text-white"
            >
              Save Report
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}