"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import RequireSignedInUser from "../../../components/access/RequireSignedInUser";
import {
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";

type AccessStatus =
  | "pending"
  | "approved"
  | "suspended";

type AdminUserRow = {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  general_location: string;
  access_status: AccessStatus;
  is_admin: boolean;
  created_at: string;
};

const BOOTSTRAP_ADMIN_EMAILS =
  new Set([
    "thesmilingmonad@gmail.com",
    "benlengrey@gmail.com",
  ]);

function normalizeEmail(
  value: string,
): string {
  return value.trim().toLowerCase();
}

function isBootstrapAdministrator(
  email: string,
): boolean {
  return BOOTSTRAP_ADMIN_EMAILS.has(
    normalizeEmail(email),
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] =
    useState<AdminUserRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busyUserId, setBusyUserId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [isAdmin, setIsAdmin] =
    useState(false);

  const pendingCount = useMemo(
    () =>
      users.filter(
        (user) =>
          user.access_status === "pending",
      ).length,
    [users],
  );

  async function loadUsers() {
    setLoading(true);
    setMessage("");

    try {
      const supabase =
        getSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "You must be signed in.",
        );
      }

      const {
        data: ownAccess,
        error: ownAccessError,
      } = await supabase
        .from("user_access")
        .select(
          "access_status, is_admin",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownAccessError) {
        throw ownAccessError;
      }

      const approvedAdmin =
        ownAccess?.access_status ===
          "approved" &&
        ownAccess?.is_admin === true;

      setIsAdmin(approvedAdmin);

      if (!approvedAdmin) {
        setUsers([]);
        setMessage(
          "Administrator access is required.",
        );
        return;
      }

      const {
        data: profileRows,
        error: profileError,
      } = await supabase
        .from("user_profiles")
        .select(
          "user_id, email, display_name, role, general_location, created_at",
        )
        .order("created_at", {
          ascending: false,
        });

      if (profileError) {
        throw profileError;
      }

      const {
        data: accessRows,
        error: accessError,
      } = await supabase
        .from("user_access")
        .select(
          "user_id, access_status, is_admin",
        );

      if (accessError) {
        throw accessError;
      }

      const accessByUserId =
        new Map(
          (accessRows ?? []).map(
            (access) => [
              access.user_id,
              access,
            ],
          ),
        );

      const combinedUsers: AdminUserRow[] =
        (profileRows ?? []).map(
          (profile) => {
            const access =
              accessByUserId.get(
                profile.user_id,
              );

            return {
              user_id: profile.user_id,
              email: profile.email,
              display_name:
                profile.display_name,
              role: profile.role,
              general_location:
                profile.general_location,
              access_status:
                access?.access_status ??
                "pending",
              is_admin:
                access?.is_admin ?? false,
              created_at:
                profile.created_at,
            };
          },
        );

      setUsers(combinedUsers);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Users could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function updateAccess(
    user: AdminUserRow,
    updates: {
      access_status?: AccessStatus;
      is_admin?: boolean;
    },
  ) {
    const protectedAdministrator =
      isBootstrapAdministrator(
        user.email,
      );

    if (
      protectedAdministrator &&
      (
        updates.access_status ===
          "pending" ||
        updates.access_status ===
          "suspended" ||
        updates.is_admin === false
      )
    ) {
      setMessage(
        "The bootstrap administrator account cannot be suspended, returned to pending or stripped of administrator access.",
      );
      return;
    }

    setBusyUserId(user.user_id);
    setMessage("");

    try {
      const supabase =
        getSupabaseBrowserClient();

      const payload: Record<
        string,
        unknown
      > = {
        ...updates,
      };

      if (
        updates.is_admin === true &&
        updates.access_status === undefined
      ) {
        payload.access_status =
          "approved";
        payload.approved_at =
          new Date().toISOString();
      }

      if (
        updates.access_status ===
        "approved"
      ) {
        payload.approved_at =
          new Date().toISOString();
      }

      if (
        updates.access_status ===
          "pending" ||
        updates.access_status ===
          "suspended"
      ) {
        payload.approved_at = null;

        if (
          updates.is_admin === undefined
        ) {
          payload.is_admin = false;
        }
      }

      const { error } =
        await supabase
          .from("user_access")
          .update(payload)
          .eq(
            "user_id",
            user.user_id,
          );

      if (error) {
        throw error;
      }

      setUsers((currentUsers) =>
        currentUsers.map(
          (currentUser) =>
            currentUser.user_id ===
            user.user_id
              ? {
                  ...currentUser,
                  ...updates,
                  access_status:
                    (payload.access_status as
                      | AccessStatus
                      | undefined) ??
                    updates.access_status ??
                    currentUser.access_status,
                  is_admin:
                    (payload.is_admin as
                      | boolean
                      | undefined) ??
                    updates.is_admin ??
                    currentUser.is_admin,
                }
              : currentUser,
        ),
      );

      setMessage(
        "User access updated.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Access could not be updated.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <RequireSignedInUser>
      <main className="min-h-screen bg-[#f4efe5] px-5 py-8 text-[#2c2a26]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
                Smiling Monad
              </p>

              <h1 className="mt-2 text-3xl font-semibold">
                Admin User Centre
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-black/65">
                Review registered users, approve practice access and pause access when needed.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadUsers()
                }
                className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold"
              >
                Refresh
              </button>

              <Link
                href="/office"
                className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
              >
                Return to Office
              </Link>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/45">
                Registered users
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {users.length}
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/45">
                Awaiting approval
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/45">
                Your access
              </p>

              <p className="mt-2 text-xl font-semibold">
                {isAdmin
                  ? "Approved administrator"
                  : "Not an administrator"}
              </p>
            </div>
          </div>

          {message ? (
            <p className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-sm leading-6">
              {message}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-black/10 bg-white/80 p-6 text-center shadow-sm">
                Loading users…
              </div>
            ) : null}

            {!loading &&
            isAdmin &&
            users.length === 0 ? (
              <div className="rounded-3xl border border-black/10 bg-white/80 p-6 text-center shadow-sm">
                No users found.
              </div>
            ) : null}

            {!loading &&
              isAdmin &&
              users.map((user) => {
                const busy =
                  busyUserId ===
                  user.user_id;

                const protectedAdministrator =
                  isBootstrapAdministrator(
                    user.email,
                  );

                return (
                  <article
                    key={user.user_id}
                    className="rounded-[1.75rem] border border-black/10 bg-white/85 p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold">
                            {user.display_name ||
                              "Unnamed user"}
                          </h2>

                          {user.is_admin ? (
                            <span className="rounded-full bg-[#e7ddc8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
                              Administrator
                            </span>
                          ) : null}

                          {protectedAdministrator ? (
                            <span className="rounded-full bg-[#dce8d7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
                              Protected bootstrap
                            </span>
                          ) : null}

                          <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
                            {user.access_status}
                          </span>
                        </div>

                        <p className="mt-2 break-all text-sm font-medium text-black/65">
                          {user.email}
                        </p>

                        <p className="mt-2 text-sm text-black/55">
                          Account role:{" "}
                          {user.is_admin
                            ? "Administrator"
                            : user.role}
                          {user.general_location
                            ? ` · ${user.general_location}`
                            : ""}
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[25rem]">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void updateAccess(
                              user,
                              {
                                access_status:
                                  "approved",
                              },
                            )
                          }
                          className="rounded-full bg-[#405d45] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy ||
                            protectedAdministrator
                          }
                          onClick={() =>
                            void updateAccess(
                              user,
                              {
                                access_status:
                                  "suspended",
                              },
                            )
                          }
                          className="rounded-full bg-[#765143] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                        >
                          Suspend
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy ||
                            protectedAdministrator
                          }
                          onClick={() =>
                            void updateAccess(
                              user,
                              {
                                access_status:
                                  "pending",
                              },
                            )
                          }
                          className="rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                        >
                          Set pending
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy ||
                            protectedAdministrator
                          }
                          onClick={() =>
                            void updateAccess(
                              user,
                              {
                                is_admin:
                                  !user.is_admin,
                              },
                            )
                          }
                          className="rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                        >
                          {user.is_admin
                            ? "Remove admin"
                            : "Make admin"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </main>
    </RequireSignedInUser>
  );
}