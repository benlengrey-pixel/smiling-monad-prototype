"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createSecurePrivacyRequest,
  isPrivacyRequestOverdue,
  readSecurePrivacyRequests,
  updateSecurePrivacyRequest,
  type PrivacyRequestStatus,
  type PrivacyRequestType,
  type SecurePrivacyRequest,
} from "@/lib/circle/secure-privacy-requests-client";

type PrivacyRightsRequestsPanelProps = {
  participantId: string;
  circleId: string;
};

const requestTypes: Array<{
  value: PrivacyRequestType;
  label: string;
}> = [
  {
    value: "access",
    label: "Access my information",
  },
  {
    value: "correction",
    label: "Correct my information",
  },
  {
    value: "export",
    label: "Export my information",
  },
  {
    value: "restriction",
    label: "Restrict use of my information",
  },
  {
    value: "deletion",
    label: "Delete eligible information",
  },
];

const statusLabels: Record<
  PrivacyRequestStatus,
  string
> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  completed: "Completed",
  partially_completed: "Partially completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export default function PrivacyRightsRequestsPanel({
  participantId,
  circleId,
}: PrivacyRightsRequestsPanelProps) {
  const [requests, setRequests] =
    useState<SecurePrivacyRequest[]>([]);

  const [requestType, setRequestType] =
    useState<PrivacyRequestType>("access");

  const [requestDetails, setRequestDetails] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [workingId, setWorkingId] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function refreshRequests() {
    if (!circleId) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const nextRequests =
        await readSecurePrivacyRequests(
          circleId,
        );

      setRequests(nextRequests);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Privacy requests could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshRequests();
  }, [circleId]);

  async function submitRequest(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !participantId ||
      !circleId ||
      !requestDetails.trim()
    ) {
      setMessage(
        "Describe the information or action being requested.",
      );
      return;
    }

    setWorkingId("new");
    setMessage("");

    try {
      await createSecurePrivacyRequest({
        participantId,
        circleId,
        requestType,
        requestDetails,
      });

      setRequestDetails("");
      setMessage(
        "Privacy request submitted securely.",
      );

      await refreshRequests();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The privacy request could not be submitted.",
      );
    } finally {
      setWorkingId("");
    }
  }

  async function changeStatus(
    request: SecurePrivacyRequest,
    status: PrivacyRequestStatus,
  ) {
    setWorkingId(request.id);
    setMessage("");

    try {
      await updateSecurePrivacyRequest({
        requestId: request.id,
        status,
        identityVerified:
          status === "acknowledged",
      });

      await refreshRequests();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The privacy request could not be updated.",
      );
    } finally {
      setWorkingId("");
    }
  }

  return (
    <section className="mt-6 rounded-[22px] border border-[#d8c7b1] bg-[#f7efe4] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
        Privacy rights
      </p>

      <h2 className="mt-2 font-serif text-2xl text-[#4c3728]">
        Access, correction and deletion requests
      </h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d5e50]">
        Record and track requests to access, correct, export, restrict or delete eligible personal information.
      </p>

      <form
        onSubmit={submitRequest}
        className="mt-5 space-y-4 rounded-[18px] border border-[#decfba] bg-white/60 p-4"
      >
        <label className="block">
          <span className="text-sm font-semibold text-[#4c3728]">
            Request type
          </span>

          <select
            value={requestType}
            onChange={(event) =>
              setRequestType(
                event.target
                  .value as PrivacyRequestType,
              )
            }
            className="mt-2 w-full rounded-[14px] border border-[#cdbba4] bg-white px-4 py-3 text-[#4c3728]"
          >
            {requestTypes.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#4c3728]">
            Details
          </span>

          <textarea
            value={requestDetails}
            onChange={(event) =>
              setRequestDetails(
                event.target.value,
              )
            }
            rows={4}
            placeholder="Describe the information required or the change requested."
            className="mt-2 w-full rounded-[14px] border border-[#cdbba4] bg-white px-4 py-3 text-[#4c3728]"
          />
        </label>

        <button
          type="submit"
          disabled={workingId === "new"}
          className="rounded-full bg-[#60432f] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {workingId === "new"
            ? "Submitting…"
            : "Submit privacy request"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-[14px] border border-[#d9cab6] bg-[#efe4d4] px-4 py-3 text-sm text-[#6d5e50]">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-5 text-sm text-[#756151]">
          Loading privacy requests…
        </p>
      ) : requests.length === 0 ? (
        <p className="mt-5 rounded-[16px] border border-dashed border-[#cdbba4] p-4 text-sm text-[#756151]">
          No privacy requests have been recorded.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {requests.map((request) => {
            const overdue =
              isPrivacyRequestOverdue(request);

            return (
              <article
                key={request.id}
                className="rounded-[18px] border border-[#decfba] bg-white/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize text-[#4c3728]">
                      {request.request_type.replaceAll(
                        "_",
                        " ",
                      )}
                    </p>

                    <p className="mt-1 text-sm text-[#6d5e50]">
                      {statusLabels[request.status]}
                      {" · Due "}
                      {formatDate(request.due_at)}
                    </p>
                  </div>

                  {overdue ? (
                    <span className="rounded-full border border-[#d7aaa0] bg-[#f8e3de] px-3 py-1 text-xs font-semibold text-[#7b4438]">
                      Overdue
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-[#5f5145]">
                  {request.request_details}
                </p>

                {request.outcome_summary ? (
                  <p className="mt-3 rounded-[12px] bg-[#efe4d4] px-3 py-2 text-sm text-[#5f5145]">
                    <strong>Outcome:</strong>{" "}
                    {request.outcome_summary}
                  </p>
                ) : null}

                {request.refusal_reason ? (
                  <p className="mt-3 rounded-[12px] bg-[#f8e3de] px-3 py-2 text-sm text-[#7b4438]">
                    <strong>Refusal reason:</strong>{" "}
                    {request.refusal_reason}
                  </p>
                ) : null}

                {![
                  "completed",
                  "partially_completed",
                  "declined",
                  "cancelled",
                ].includes(request.status) ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {request.status ===
                    "submitted" ? (
                      <button
                        type="button"
                        disabled={
                          workingId === request.id
                        }
                        onClick={() =>
                          void changeStatus(
                            request,
                            "acknowledged",
                          )
                        }
                        className="rounded-full border border-[#bca68d] bg-white px-4 py-2 text-sm font-semibold text-[#5e4938]"
                      >
                        Acknowledge
                      </button>
                    ) : null}

                    {request.status !==
                    "in_progress" ? (
                      <button
                        type="button"
                        disabled={
                          workingId === request.id
                        }
                        onClick={() =>
                          void changeStatus(
                            request,
                            "in_progress",
                          )
                        }
                        className="rounded-full border border-[#bca68d] bg-white px-4 py-2 text-sm font-semibold text-[#5e4938]"
                      >
                        Start work
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={
                        workingId === request.id
                      }
                      onClick={() =>
                        void changeStatus(
                          request,
                          "completed",
                        )
                      }
                      className="rounded-full bg-[#60432f] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Complete
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}