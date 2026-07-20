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
  | "approved"
  | "pending"
  | "suspended";

type AdminSection =
  | "overview"
  | "users"
  | "usage"
  | "system";

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

type UsageSummary = {
  total_events: number;
  active_users: number;
  office_events: number;
  community_events: number;
  training_events: number;
  wellbeing_events: number;
  circle_events: number;
};

const EMPTY_USAGE: UsageSummary = {
  total_events: 0,
  active_users: 0,
  office_events: 0,
  community_events: 0,
  training_events: 0,
  wellbeing_events: 0,
  circle_events: 0,
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

function isProtectedAdministrator(
  email: string,
): boolean {
  return BOOTSTRAP_ADMIN_EMAILS.has(
    normalizeEmail(email),
  );
}

export default function AdminUsersPage() {
  const [section, setSection] =
    useState<AdminSection>("overview");

  const [users, setUsers] =
    useState<AdminUserRow[]>([]);

  const [usage, setUsage] =
    useState<UsageSummary>(EMPTY_USAGE);

  const [loading, setLoading] =
    useState(true);

  const [busyUserId, setBusyUserId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const approvedCount = useMemo(
    () =>
      users.filter(
        (user) =>
          user.access_status ===
          "approved",
      ).length,
    [users],
  );

  const suspendedCount = useMemo(
    () =>
      users.filter(
        (user) =>
          user.access_status ===
          "suspended",
      ).length,
    [users],
  );

  const adminCount = useMemo(
    () =>
      users.filter(
        (user) => user.is_admin,
      ).length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [
        user.email,
        user.display_name,
        user.role,
        user.general_location,
        user.access_status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, users]);

  async function loadAdminData() {
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

      const [
        profileResult,
        accessResult,
        usageResult,
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select(
            "user_id, email, display_name, role, general_location, created_at",
          )
          .order("created_at", {
            ascending: false,
          }),
        supabase
          .from("user_access")
          .select(
            "user_id, access_status, is_admin",
          ),
        supabase.rpc(
          "sm_admin_usage_summary",
          {
            days_back: 30,
          },
        ),
      ]);

      if (profileResult.error) {
        throw profileResult.error;
      }

      if (accessResult.error) {
        throw accessResult.error;
      }

      const accessByUserId =
        new Map(
          (
            accessResult.data ?? []
          ).map((access) => [
            access.user_id,
            access,
          ]),
        );

      const combinedUsers: AdminUserRow[] =
        (
          profileResult.data ?? []
        ).map((profile) => {
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
              "approved",
            is_admin:
              access?.is_admin ?? false,
            created_at:
              profile.created_at,
          };
        });

      setUsers(combinedUsers);

      const usageRow =
        usageResult.data?.[0];

      if (
        !usageResult.error &&
        usageRow
      ) {
        setUsage({
          total_events:
            Number(
              usageRow.total_events,
            ) || 0,
          active_users:
            Number(
              usageRow.active_users,
            ) || 0,
          office_events:
            Number(
              usageRow.office_events,
            ) || 0,
          community_events:
            Number(
              usageRow.community_events,
            ) || 0,
          training_events:
            Number(
              usageRow.training_events,
            ) || 0,
          wellbeing_events:
            Number(
              usageRow.wellbeing_events,
            ) || 0,
          circle_events:
            Number(
              usageRow.circle_events,
            ) || 0,
        });
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Administrator data could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function updateAccess(
    user: AdminUserRow,
    updates: {
      access_status?: AccessStatus;
      is_admin?: boolean;
    },
  ) {
    const protectedAdmin =
      isProtectedAdministrator(
        user.email,
      );

    if (
      protectedAdmin &&
      (
        updates.access_status ===
          "pending" ||
        updates.access_status ===
          "suspended" ||
        updates.is_admin === false
      )
    ) {
      setMessage(
        "The protected bootstrap administrator cannot be suspended or stripped of administrator access.",
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
        payload.is_admin = false;
      }

      if (
        updates.is_admin === true
      ) {
        payload.access_status =
          "approved";
        payload.approved_at =
          new Date().toISOString();
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

      await loadAdminData();

      setMessage(
        "Account controls updated.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Account controls could not be updated.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function deleteAccount(
    user: AdminUserRow,
  ) {
    if (
      isProtectedAdministrator(
        user.email,
      )
    ) {
      setMessage(
        "The protected bootstrap administrator account cannot be deleted.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Permanently delete ${user.email}? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setBusyUserId(user.user_id);
    setMessage("");

    try {
      const supabase =
        getSupabaseBrowserClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your administrator session could not be verified.",
        );
      }

      const response = await fetch(
        "/api/admin/users/delete",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.user_id,
          }),
        },
      );

      const result =
        (await response.json()) as {
          error?: string;
          deleted?: boolean;
        };

      if (
        !response.ok ||
        !result.deleted
      ) {
        throw new Error(
          result.error ??
            "The account could not be deleted.",
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) =>
            currentUser.user_id !==
            user.user_id,
        ),
      );

      setMessage(
        "Account permanently deleted.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The account could not be deleted.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  const navigation: Array<{
    id: AdminSection;
    label: string;
  }> = [
    {
      id: "overview",
      label: "Overview",
    },
    {
      id: "users",
      label: "Users",
    },
    {
      id: "usage",
      label: "App use",
    },
    {
      id: "system",
      label: "System",
    },
  ];

  return (
    <RequireSignedInUser>
      <main className="min-h-screen bg-[#f4efe5] px-5 py-8 text-[#2c2a26]">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
                Smiling Monad
              </p>

              <h1 className="mt-2 text-3xl font-semibold">
                Administrator Control Centre
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-black/65">
                Manage members, account access, moderation, app activity and core administration.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadAdminData()
                }
                className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold"
              >
                Refresh data
              </button>

              <Link
                href="/office"
                className="rounded-full bg-[#2c2a26] px-5 py-3 text-sm font-semibold text-white"
              >
                Return to Office
              </Link>
            </div>
          </header>

          <nav className="mt-7 flex flex-wrap gap-2 rounded-3xl border border-black/10 bg-white/70 p-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setSection(item.id)
                }
                className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                  section === item.id
                    ? "bg-[#2c2a26] text-white"
                    : "bg-white text-black/65"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {message ? (
            <p className="mt-5 rounded-2xl bg-black/5 px-4 py-3 text-sm leading-6">
              {message}
            </p>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-3xl border border-black/10 bg-white/80 p-8 text-center shadow-sm">
              Loading administrator data…
            </div>
          ) : null}

          {!loading &&
          !isAdmin ? (
            <div className="mt-6 rounded-3xl border border-[#d3a77d] bg-[#fff3e5] p-7">
              <h2 className="text-2xl font-semibold">
                Administrator access required
              </h2>
            </div>
          ) : null}

          {!loading &&
          isAdmin &&
          section === "overview" ? (
            <section className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Registered users"
                  value={users.length}
                />
                <MetricCard
                  label="Active access"
                  value={approvedCount}
                />
                <MetricCard
                  label="Suspended"
                  value={suspendedCount}
                />
                <MetricCard
                  label="Administrators"
                  value={adminCount}
                />
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <article className="rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold">
                    Community controls
                  </h2>

                  <p className="mt-3 leading-7 text-black/65">
                    New members receive access automatically. Administrators can suspend harmful accounts, restore access or permanently remove an account when necessary.
                  </p>
                </article>

                <article className="rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm">
                  <h2 className="text-2xl font-semibold">
                    Last 30 days
                  </h2>

                  <p className="mt-3 text-4xl font-semibold">
                    {usage.total_events}
                  </p>

                  <p className="mt-2 text-sm text-black/55">
                    recorded app events from{" "}
                    {usage.active_users} active users
                  </p>
                </article>
              </div>
            </section>
          ) : null}

          {!loading &&
          isAdmin &&
          section === "users" ? (
            <section className="mt-6">
              <div className="rounded-3xl border border-black/10 bg-white/80 p-4">
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search users, roles, locations or status"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                />
              </div>

              <div className="mt-4 space-y-4">
                {filteredUsers.map(
                  (user) => {
                    const busy =
                      busyUserId ===
                      user.user_id;

                    const protectedAdmin =
                      isProtectedAdministrator(
                        user.email,
                      );

                    return (
                      <article
                        key={user.user_id}
                        className="rounded-[1.75rem] border border-black/10 bg-white/85 p-5 shadow-sm sm:p-6"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-semibold">
                                {user.display_name ||
                                  "Unnamed user"}
                              </h2>

                              {user.is_admin ? (
                                <StatusBadge>
                                  Administrator
                                </StatusBadge>
                              ) : null}

                              {protectedAdmin ? (
                                <StatusBadge>
                                  Protected
                                </StatusBadge>
                              ) : null}

                              <StatusBadge>
                                {user.access_status}
                              </StatusBadge>
                            </div>

                            <p className="mt-2 break-all text-sm font-medium text-black/65">
                              {user.email}
                            </p>

                            <p className="mt-2 text-sm text-black/55">
                              Role: {user.role}
                              {user.general_location
                                ? ` · ${user.general_location}`
                                : ""}
                            </p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[34rem] xl:grid-cols-3">
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
                              className="rounded-full bg-[#405d45] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                            >
                              Restore access
                            </button>

                            <button
                              type="button"
                              disabled={
                                busy ||
                                protectedAdmin
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
                                protectedAdmin
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

                            <button
                              type="button"
                              disabled={
                                busy ||
                                protectedAdmin
                              }
                              onClick={() =>
                                void deleteAccount(
                                  user,
                                )
                              }
                              className="rounded-full border border-[#8a3b32] bg-white px-4 py-2.5 text-sm font-semibold text-[#8a3b32] disabled:opacity-40 sm:col-span-2 xl:col-span-3"
                            >
                              Permanently delete account
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </section>
          ) : null}

          {!loading &&
          isAdmin &&
          section === "usage" ? (
            <section className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Total events"
                  value={usage.total_events}
                />
                <MetricCard
                  label="Active users"
                  value={usage.active_users}
                />
                <MetricCard
                  label="Office"
                  value={usage.office_events}
                />
                <MetricCard
                  label="Community"
                  value={usage.community_events}
                />
                <MetricCard
                  label="Training"
                  value={usage.training_events}
                />
                <MetricCard
                  label="Wellbeing"
                  value={usage.wellbeing_events}
                />
                <MetricCard
                  label="Circle Centre"
                  value={usage.circle_events}
                />
              </div>

              <p className="mt-5 rounded-3xl border border-black/10 bg-white/80 p-6 leading-7 text-black/65">
                Usage totals will populate as app areas begin recording events. This dashboard intentionally reports activity counts rather than private conversation content.
              </p>
            </section>
          ) : null}

          {!loading &&
          isAdmin &&
          section === "system" ? (
            <section className="mt-6 grid gap-5 lg:grid-cols-2">
              <article className="rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm">
                <h2 className="text-2xl font-semibold">
                  Access model
                </h2>

                <p className="mt-3 leading-7 text-black/65">
                  New members are approved automatically. Suspended members remain recorded but cannot enter protected areas. Deleted accounts are permanently removed from Supabase authentication.
                </p>
              </article>

              <article className="rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm">
                <h2 className="text-2xl font-semibold">
                  Protected administrators
                </h2>

                <p className="mt-3 leading-7 text-black/65">
                  The bootstrap administrator accounts cannot be suspended, demoted or deleted through this screen.
                </p>
              </article>

              <article className="rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm lg:col-span-2">
                <h2 className="text-2xl font-semibold">
                  Privacy boundary
                </h2>

                <p className="mt-3 leading-7 text-black/65">
                  Administrator analytics should focus on account status, feature usage and system health. Private Companion conversations should not be exposed here unless a separate, clearly authorised safety or support process is designed.
                </p>
              </article>
            </section>
          ) : null}
        </div>
      </main>
    </RequireSignedInUser>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-black/45">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold">
        {value}
      </p>
    </article>
  );
}

function StatusBadge({
  children,
}: {
  children: string;
}) {
  return (
    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]">
      {children}
    </span>
  );
}