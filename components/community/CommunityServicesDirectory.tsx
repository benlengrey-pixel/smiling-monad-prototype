"use client";

import {
  useMemo,
  useState,
} from "react";

import useCommunityServicesDirectory, {
  type CommunityServiceCircleSaveForm,
  type CommunityServiceEnquiryForm,
  type CommunityServiceListingForm,
  type CommunityServiceResponseForm,
  type CommunityServicesDirectoryMode,
} from "@/hooks/community/useCommunityServicesDirectory";

import type {
  CommunityServiceAgeGroup,
  CommunityServiceCategory,
  CommunityServiceDeliveryMethod,
  CommunityServiceEnquiry,
  CommunityServiceListing,
  CommunityServiceNdisRegistrationStatus,
  CommunityServicePreferredContactMethod,
  CommunityServiceProviderType,
  CommunityServiceReviewDecision,
  CommunityServiceVerificationStatus,
} from "@/lib/community/secure-community-services-client";

type CommunityServicesDirectoryProps = {
  signedIn: boolean;
};

const MODE_LABELS: Record<
  CommunityServicesDirectoryMode,
  string
> = {
  browse: "Browse services",
  saved: "Saved services",
  "my-listings": "My listings",
  moderation: "Moderation",
};

const PROVIDER_TYPE_LABELS: Record<
  CommunityServiceProviderType,
  string
> = {
  individual: "Individual",
  organisation: "Organisation",
  community_group: "Community group",
  business: "Business",
};

const CATEGORY_LABELS: Record<
  CommunityServiceCategory,
  string
> = {
  support_work: "Support work",
  support_coordination:
    "Support coordination",
  allied_health: "Allied health",
  therapy: "Therapy",
  community_access:
    "Community access",
  transport: "Transport",
  respite: "Respite",
  housing: "Housing",
  employment: "Employment",
  education_training:
    "Education and training",
  plan_management:
    "Plan management",
  assistive_technology:
    "Assistive technology",
  advocacy: "Advocacy",
  social_group: "Social group",
  health_wellbeing:
    "Health and wellbeing",
  disability_friendly_business:
    "Disability-friendly business",
  other: "Other",
};

const DELIVERY_METHOD_LABELS: Record<
  CommunityServiceDeliveryMethod,
  string
> = {
  in_person: "In person",
  online: "Online",
  phone: "Phone",
  home_visit: "Home visit",
  community: "Community",
  group: "Group",
  other: "Other",
};

const AGE_GROUP_LABELS: Record<
  CommunityServiceAgeGroup,
  string
> = {
  children: "Children",
  teenagers: "Teenagers",
  young_adults: "Young adults",
  adults: "Adults",
  older_people: "Older people",
  all_ages: "All ages",
};

const NDIS_STATUS_LABELS: Record<
  CommunityServiceNdisRegistrationStatus,
  string
> = {
  registered: "Registered",
  unregistered: "Unregistered",
  not_applicable: "Not applicable",
  not_stated: "Not stated",
};

const VERIFICATION_LABELS: Record<
  CommunityServiceVerificationStatus,
  string
> = {
  unverified: "Unverified",
  claimed: "Claim submitted",
  verified: "Verified",
  rejected: "Verification rejected",
};

function toggleArrayValue<Value extends string>(
  values: Value[],
  value: Value,
): Value[] {
  return values.includes(value)
    ? values.filter(
        (item) => item !== value,
      )
    : [...values, value];
}

function listingStatusLabel(
  listing: CommunityServiceListing,
): string {
  return listing.moderation_status
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function ListingCard({
  listing,
  saved,
  working,
  canSave,
  onSelect,
  onToggleSaved,
  onEdit,
  onSubmit,
  onReview,
}: {
  listing: CommunityServiceListing;
  saved: boolean;
  working: boolean;
  canSave: boolean;
  onSelect: () => void;
  onToggleSaved: () => void;
  onEdit?: () => void;
  onSubmit?: () => void;
  onReview?: () => void;
}) {
  return (
    <article className="rounded-[24px] border border-[#dfd2c1] bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b745d]">
              {
                CATEGORY_LABELS[
                  listing.service_category
                ]
              }
            </p>

            <h3 className="mt-2 font-serif text-2xl text-[#4f3728]">
              {listing.service_name}
            </h3>

            <p className="mt-1 text-sm text-[#756151]">
              {listing.organisation_name}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {listing.verification_status ===
            "verified" ? (
              <span className="rounded-full bg-[#e9f0e8] px-3 py-1 text-xs font-semibold text-[#486245]">
                Verified
              </span>
            ) : null}

            {listing.moderation_status !==
            "approved" ? (
              <span className="rounded-full bg-[#f4eadc] px-3 py-1 text-xs font-semibold text-[#7a5f47]">
                {listingStatusLabel(
                  listing,
                )}
              </span>
            ) : null}

            {listing.accepts_ndis_funding ? (
              <span className="rounded-full border border-[#cdbba4] px-3 py-1 text-xs text-[#60432f]">
                NDIS funding
              </span>
            ) : null}
          </div>
        </div>

        <p className="mt-4 leading-7 text-[#6b5d50]">
          {listing.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {listing.service_areas
            .slice(0, 4)
            .map((area) => (
              <span
                key={area}
                className="rounded-full bg-[#f7efe4] px-3 py-1 text-xs text-[#6f5947]"
              >
                {area}
              </span>
            ))}

          {listing.service_areas.length >
          4 ? (
            <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-xs text-[#6f5947]">
              +
              {listing.service_areas
                .length - 4}{" "}
              more
            </span>
          ) : null}
        </div>
      </button>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#ece2d7] pt-4">
        {canSave ? (
          <button
            type="button"
            onClick={onToggleSaved}
            disabled={working}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              saved
                ? "bg-[#60432f] text-white"
                : "border border-[#d6c6b1] text-[#60432f]"
            }`}
          >
            {saved
              ? "Saved"
              : "Save service"}
          </button>
        ) : null}

        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            disabled={working}
            className="rounded-full border border-[#d6c6b1] px-4 py-2 text-sm font-medium text-[#60432f]"
          >
            Edit
          </button>
        ) : null}

        {onSubmit ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={working}
            className="rounded-full bg-[#8e6a4f] px-4 py-2 text-sm font-medium text-white"
          >
            Submit for review
          </button>
        ) : null}

        {onReview ? (
          <button
            type="button"
            onClick={onReview}
            disabled={working}
            className="rounded-full bg-[#60432f] px-4 py-2 text-sm font-medium text-white"
          >
            Review listing
          </button>
        ) : null}
      </div>
    </article>
  );
}

function ListingDetails({
  listing,
  signedIn,
  onEnquire,
  onSaveToCircle,
}: {
  listing: CommunityServiceListing;
  signedIn: boolean;
  onEnquire: () => void;
  onSaveToCircle: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-[#dfd2c1] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
        Service profile
      </p>

      <h2 className="mt-3 font-serif text-3xl text-[#4f3728]">
        {listing.service_name}
      </h2>

      <p className="mt-1 text-[#756151]">
        {listing.organisation_name}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-xs font-medium text-[#60432f]">
          {
            CATEGORY_LABELS[
              listing.service_category
            ]
          }
        </span>

        <span className="rounded-full border border-[#d6c6b1] px-3 py-1 text-xs text-[#756151]">
          {
            PROVIDER_TYPE_LABELS[
              listing.provider_type
            ]
          }
        </span>

        <span className="rounded-full border border-[#d6c6b1] px-3 py-1 text-xs text-[#756151]">
          {
            NDIS_STATUS_LABELS[
              listing.ndis_registration_status
            ]
          }
        </span>

        <span className="rounded-full border border-[#d6c6b1] px-3 py-1 text-xs text-[#756151]">
          {
            VERIFICATION_LABELS[
              listing.verification_status
            ]
          }
        </span>
      </div>

      <p className="mt-6 whitespace-pre-wrap leading-8 text-[#5f5145]">
        {listing.description}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[20px] bg-[#f7efe4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
            Service areas
          </p>

          <p className="mt-2 leading-7 text-[#60432f]">
            {listing.service_areas.join(
              ", ",
            )}
          </p>
        </div>

        <div className="rounded-[20px] bg-[#f7efe4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
            Delivery
          </p>

          <p className="mt-2 leading-7 text-[#60432f]">
            {listing.delivery_methods
              .map(
                (method) =>
                  DELIVERY_METHOD_LABELS[
                    method
                  ],
              )
              .join(", ")}
          </p>
        </div>

        <div className="rounded-[20px] bg-[#f7efe4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
            Age groups
          </p>

          <p className="mt-2 leading-7 text-[#60432f]">
            {listing.age_groups
              .map(
                (group) =>
                  AGE_GROUP_LABELS[
                    group
                  ],
              )
              .join(", ")}
          </p>
        </div>

        <div className="rounded-[20px] bg-[#f7efe4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
            Languages
          </p>

          <p className="mt-2 leading-7 text-[#60432f]">
            {listing.languages.join(
              ", ",
            )}
          </p>
        </div>
      </div>

      {listing.accessibility_features
        .length > 0 ? (
        <div className="mt-4 rounded-[20px] border border-[#dfd2c1] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
            Accessibility
          </p>

          <p className="mt-2 leading-7 text-[#60432f]">
            {listing.accessibility_features.join(
              ", ",
            )}
          </p>
        </div>
      ) : null}

      {listing.availability_summary ||
      listing.pricing_summary ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {listing.availability_summary ? (
            <div className="rounded-[20px] border border-[#dfd2c1] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
                Availability
              </p>

              <p className="mt-2 leading-7 text-[#60432f]">
                {
                  listing.availability_summary
                }
              </p>
            </div>
          ) : null}

          {listing.pricing_summary ? (
            <div className="rounded-[20px] border border-[#dfd2c1] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
                Pricing
              </p>

              <p className="mt-2 leading-7 text-[#60432f]">
                {
                  listing.pricing_summary
                }
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {signedIn ? (
          <>
            <button
              type="button"
              onClick={onEnquire}
              className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white"
            >
              Send private enquiry
            </button>

            <button
              type="button"
              onClick={onSaveToCircle}
              className="rounded-full border border-[#d6c6b1] px-5 py-3 font-medium text-[#60432f]"
            >
              Save to a Circle
            </button>
          </>
        ) : null}

        {listing.website_url ? (
          <a
            href={listing.website_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white"
          >
            Visit website
          </a>
        ) : null}

        {listing.public_email ? (
          <a
            href={`mailto:${listing.public_email}`}
            className="rounded-full border border-[#d6c6b1] px-5 py-3 font-medium text-[#60432f]"
          >
            Email service
          </a>
        ) : null}

        {listing.public_phone ? (
          <a
            href={`tel:${listing.public_phone}`}
            className="rounded-full border border-[#d6c6b1] px-5 py-3 font-medium text-[#60432f]"
          >
            Call service
          </a>
        ) : null}
      </div>

      <p className="mt-6 text-xs leading-5 text-[#8b745d]">
        Directory information is
        supplied by the listing owner.
        Verification status is shown
        separately and does not replace
        your own checks.
      </p>
    </section>
  );
}


function EnquiryComposer({
  form,
  working,
  onFieldChange,
  onSend,
  onCancel,
}: {
  form: CommunityServiceEnquiryForm;
  working: boolean;
  onFieldChange: <
    Key extends
      keyof CommunityServiceEnquiryForm,
  >(
    key: Key,
    value:
      CommunityServiceEnquiryForm[Key],
  ) => void;
  onSend: () => void;
  onCancel: () => void;
}) {
  const sharesContact =
    form.preferredContactMethod !==
    "platform";

  return (
    <section className="rounded-[28px] border border-[#dfd2c1] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
        Private service enquiry
      </p>

      <h2 className="mt-3 font-serif text-3xl text-[#4f3728]">
        {form.serviceName}
      </h2>

      <p className="mt-2 leading-7 text-[#756151]">
        This enquiry is visible only to
        you and the owner of this service
        listing.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Subject
          </span>

          <input
            value={form.subject}
            onChange={(event) =>
              onFieldChange(
                "subject",
                event.target.value,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Message
          </span>

          <textarea
            value={form.message}
            onChange={(event) =>
              onFieldChange(
                "message",
                event.target.value,
              )
            }
            rows={6}
            placeholder="Describe what you would like to know. Do not include private participant records."
            className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Preferred contact method
          </span>

          <select
            value={
              form.preferredContactMethod
            }
            onChange={(event) =>
              onFieldChange(
                "preferredContactMethod",
                event.target
                  .value as CommunityServicePreferredContactMethod,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          >
            <option value="platform">
              Reply inside the platform
            </option>

            <option value="email">
              Email
            </option>

            <option value="phone">
              Phone
            </option>
          </select>
        </label>

        {sharesContact ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                Contact name
              </span>

              <input
                value={form.contactName}
                onChange={(event) =>
                  onFieldChange(
                    "contactName",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />
            </label>

            {form.preferredContactMethod ===
            "email" ? (
              <label>
                <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                  Contact email
                </span>

                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) =>
                    onFieldChange(
                      "contactEmail",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                />
              </label>
            ) : (
              <label>
                <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                  Contact phone
                </span>

                <input
                  value={form.contactPhone}
                  onChange={(event) =>
                    onFieldChange(
                      "contactPhone",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                />
              </label>
            )}

            <label className="sm:col-span-2 flex items-start gap-3 rounded-2xl border border-[#d6c6b1] bg-[#fffaf1] p-4">
              <input
                type="checkbox"
                checked={
                  form.consentToShareContact
                }
                onChange={(event) =>
                  onFieldChange(
                    "consentToShareContact",
                    event.target.checked,
                  )
                }
                className="mt-1"
              />

              <span className="text-sm leading-6 text-[#60432f]">
                I consent to this contact
                information being shared
                with the service listing
                owner for this enquiry.
              </span>
            </label>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSend}
          disabled={working}
          className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white disabled:opacity-60"
        >
          Send private enquiry
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={working}
          className="rounded-full border border-[#d6c6b1] px-5 py-3 font-medium text-[#60432f]"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

function CircleSaveComposer({
  form,
  circles,
  working,
  saved,
  onFieldChange,
  onSave,
  onRemove,
  onCancel,
}: {
  form: CommunityServiceCircleSaveForm;
  circles: Array<{
    circle: {
      id: string;
      participant_id: string;
      name: string;
    };
    participant: {
      preferred_name: string;
      full_name: string;
    };
  }>;
  working: boolean;
  saved: {
    id: string;
    archived_at: string | null;
  } | null;
  onFieldChange: <
    Key extends
      keyof CommunityServiceCircleSaveForm,
  >(
    key: Key,
    value:
      CommunityServiceCircleSaveForm[Key],
  ) => void;
  onSave: () => void;
  onRemove: (saveId: string) => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-[#dfd2c1] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
        Private Circle resource
      </p>

      <h2 className="mt-3 font-serif text-3xl text-[#4f3728]">
        Save {form.serviceName}
      </h2>

      <p className="mt-2 leading-7 text-[#756151]">
        The service and your note will be
        visible only to active members of
        the selected Circle.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Circle
          </span>

          <select
            value={form.circleId}
            onChange={(event) => {
              const entry =
                circles.find(
                  (circle) =>
                    circle.circle.id ===
                    event.target.value,
                );

              onFieldChange(
                "circleId",
                event.target.value,
              );

              onFieldChange(
                "participantId",
                entry?.circle
                  .participant_id ?? "",
              );
            }}
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          >
            <option value="">
              Choose a Circle
            </option>

            {circles.map((entry) => (
              <option
                key={entry.circle.id}
                value={entry.circle.id}
              >
                {entry.circle.name} —{" "}
                {entry.participant
                  .preferred_name ||
                  entry.participant
                    .full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Circle note
          </span>

          <textarea
            value={form.note}
            onChange={(event) =>
              onFieldChange(
                "note",
                event.target.value,
              )
            }
            rows={5}
            placeholder="Why might this service be useful to the Circle?"
            className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>
      </div>

      {circles.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[#f7efe4] p-4 text-sm leading-6 text-[#6f5947]">
          No accessible Circles were found.
          Create or join a Circle before
          saving this service.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={
            working ||
            !form.circleId ||
            !form.participantId
          }
          className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white disabled:opacity-60"
        >
          Save privately to Circle
        </button>

        {saved &&
        !saved.archived_at ? (
          <button
            type="button"
            onClick={() =>
              onRemove(saved.id)
            }
            disabled={working}
            className="rounded-full border border-[#c89d8c] px-5 py-3 font-medium text-[#7a4435]"
          >
            Remove from Circle
          </button>
        ) : null}

        <button
          type="button"
          onClick={onCancel}
          disabled={working}
          className="rounded-full border border-[#d6c6b1] px-5 py-3 font-medium text-[#60432f]"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

function ProviderResponseComposer({
  enquiry,
  form,
  working,
  onFieldChange,
  onSend,
  onCancel,
}: {
  enquiry:
    CommunityServiceEnquiry;
  form:
    CommunityServiceResponseForm;
  working: boolean;
  onFieldChange: <
    Key extends
      keyof CommunityServiceResponseForm,
  >(
    key: Key,
    value:
      CommunityServiceResponseForm[Key],
  ) => void;
  onSend: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-[#dfd2c1] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
        Provider response
      </p>

      <h2 className="mt-3 font-serif text-3xl text-[#4f3728]">
        {enquiry.subject}
      </h2>

      <p className="mt-4 whitespace-pre-wrap rounded-[20px] bg-[#f7efe4] p-4 leading-7 text-[#60432f]">
        {enquiry.message}
      </p>

      {enquiry.consent_to_share_contact ? (
        <div className="mt-4 rounded-[20px] border border-[#dfd2c1] p-4 text-sm leading-6 text-[#60432f]">
          <p className="font-semibold">
            Shared contact details
          </p>

          {enquiry.contact_name ? (
            <p className="mt-2">
              {enquiry.contact_name}
            </p>
          ) : null}

          {enquiry.contact_email ? (
            <p>{enquiry.contact_email}</p>
          ) : null}

          {enquiry.contact_phone ? (
            <p>{enquiry.contact_phone}</p>
          ) : null}
        </div>
      ) : null}

      <label className="mt-5 block">
        <span className="mb-1 block text-sm font-medium text-[#6f5947]">
          Response
        </span>

        <textarea
          value={form.response}
          onChange={(event) =>
            onFieldChange(
              "response",
              event.target.value,
            )
          }
          rows={6}
          className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[#d6c6b1] p-4">
        <input
          type="checkbox"
          checked={
            form.closeAfterResponse
          }
          onChange={(event) =>
            onFieldChange(
              "closeAfterResponse",
              event.target.checked,
            )
          }
        />

        <span className="text-sm font-medium text-[#60432f]">
          Close this enquiry after
          responding
        </span>
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSend}
          disabled={working}
          className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white disabled:opacity-60"
        >
          Send response
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={working}
          className="rounded-full border border-[#d6c6b1] px-5 py-3 font-medium text-[#60432f]"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

function EnquirySummary({
  enquiry,
  received,
  working,
  onRespond,
  onWithdraw,
}: {
  enquiry:
    CommunityServiceEnquiry;
  received: boolean;
  working: boolean;
  onRespond?: () => void;
  onWithdraw?: () => void;
}) {
  const listing =
    enquiry.community_service_listings;

  return (
    <article className="rounded-[22px] border border-[#dfd2c1] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8b745d]">
            {listing?.service_name ??
              "Service enquiry"}
          </p>

          <h3 className="mt-2 font-serif text-xl text-[#4f3728]">
            {enquiry.subject}
          </h3>
        </div>

        <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-xs font-semibold capitalize text-[#6f5947]">
          {enquiry.enquiry_status}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap leading-7 text-[#6b5d50]">
        {enquiry.message}
      </p>

      {enquiry.provider_response ? (
        <div className="mt-4 rounded-[18px] bg-[#edf1e9] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5f7359]">
            Provider response
          </p>

          <p className="mt-2 whitespace-pre-wrap leading-7 text-[#4f624b]">
            {enquiry.provider_response}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {received &&
        ![
          "closed",
          "withdrawn",
        ].includes(
          enquiry.enquiry_status,
        ) &&
        onRespond ? (
          <button
            type="button"
            onClick={onRespond}
            disabled={working}
            className="rounded-full bg-[#60432f] px-4 py-2 text-sm font-medium text-white"
          >
            Respond
          </button>
        ) : null}

        {!received &&
        ![
          "closed",
          "withdrawn",
        ].includes(
          enquiry.enquiry_status,
        ) &&
        onWithdraw ? (
          <button
            type="button"
            onClick={onWithdraw}
            disabled={working}
            className="rounded-full border border-[#c89d8c] px-4 py-2 text-sm font-medium text-[#7a4435]"
          >
            Withdraw
          </button>
        ) : null}
      </div>
    </article>
  );
}

function ListingEditor({
  form,
  working,
  onFieldChange,
  onSaveDraft,
  onSubmit,
}: {
  form:
    CommunityServiceListingForm;
  working: boolean;
  onFieldChange: <
    Key extends
      keyof CommunityServiceListingForm,
  >(
    key: Key,
    value:
      CommunityServiceListingForm[Key],
  ) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-[#dfd2c1] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
        Provider listing
      </p>

      <h2 className="mt-3 font-serif text-3xl text-[#4f3728]">
        {form.id
          ? "Edit service listing"
          : "Create service listing"}
      </h2>

      <p className="mt-2 leading-7 text-[#756151]">
        Listings remain private until
        they are submitted and approved.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Provider type
          </span>

          <select
            value={form.providerType}
            onChange={(event) =>
              onFieldChange(
                "providerType",
                event.target
                  .value as CommunityServiceProviderType,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          >
            {Object.entries(
              PROVIDER_TYPE_LABELS,
            ).map(
              ([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Category
          </span>

          <select
            value={
              form.serviceCategory
            }
            onChange={(event) =>
              onFieldChange(
                "serviceCategory",
                event.target
                  .value as CommunityServiceCategory,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          >
            {Object.entries(
              CATEGORY_LABELS,
            ).map(
              ([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Organisation or provider
          </span>

          <input
            value={
              form.organisationName
            }
            onChange={(event) =>
              onFieldChange(
                "organisationName",
                event.target.value,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Service name
          </span>

          <input
            value={form.serviceName}
            onChange={(event) =>
              onFieldChange(
                "serviceName",
                event.target.value,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Short summary
          </span>

          <textarea
            value={form.summary}
            onChange={(event) =>
              onFieldChange(
                "summary",
                event.target.value,
              )
            }
            rows={2}
            className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Full description
          </span>

          <textarea
            value={form.description}
            onChange={(event) =>
              onFieldChange(
                "description",
                event.target.value,
              )
            }
            rows={6}
            className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Service areas
          </span>

          <input
            value={form.serviceAreas}
            onChange={(event) =>
              onFieldChange(
                "serviceAreas",
                event.target.value,
              )
            }
            placeholder="Byron Bay, Ballina, Lismore"
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Languages
          </span>

          <input
            value={form.languages}
            onChange={(event) =>
              onFieldChange(
                "languages",
                event.target.value,
              )
            }
            placeholder="English, Japanese"
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <fieldset className="rounded-[20px] border border-[#dfd2c1] p-4">
          <legend className="px-2 text-sm font-medium text-[#6f5947]">
            Delivery methods
          </legend>

          <div className="grid gap-2">
            {Object.entries(
              DELIVERY_METHOD_LABELS,
            ).map(
              ([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-[#60432f]"
                >
                  <input
                    type="checkbox"
                    checked={form.deliveryMethods.includes(
                      value as CommunityServiceDeliveryMethod,
                    )}
                    onChange={() =>
                      onFieldChange(
                        "deliveryMethods",
                        toggleArrayValue(
                          form.deliveryMethods,
                          value as CommunityServiceDeliveryMethod,
                        ),
                      )
                    }
                  />

                  {label}
                </label>
              ),
            )}
          </div>
        </fieldset>

        <fieldset className="rounded-[20px] border border-[#dfd2c1] p-4">
          <legend className="px-2 text-sm font-medium text-[#6f5947]">
            Age groups
          </legend>

          <div className="grid gap-2">
            {Object.entries(
              AGE_GROUP_LABELS,
            ).map(
              ([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-[#60432f]"
                >
                  <input
                    type="checkbox"
                    checked={form.ageGroups.includes(
                      value as CommunityServiceAgeGroup,
                    )}
                    onChange={() =>
                      onFieldChange(
                        "ageGroups",
                        toggleArrayValue(
                          form.ageGroups,
                          value as CommunityServiceAgeGroup,
                        ),
                      )
                    }
                  />

                  {label}
                </label>
              ),
            )}
          </div>
        </fieldset>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Accessibility features
          </span>

          <input
            value={
              form.accessibilityFeatures
            }
            onChange={(event) =>
              onFieldChange(
                "accessibilityFeatures",
                event.target.value,
              )
            }
            placeholder="Wheelchair access, quiet spaces, Easy Read"
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Availability
          </span>

          <textarea
            value={
              form.availabilitySummary
            }
            onChange={(event) =>
              onFieldChange(
                "availabilitySummary",
                event.target.value,
              )
            }
            rows={3}
            className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Pricing
          </span>

          <textarea
            value={
              form.pricingSummary
            }
            onChange={(event) =>
              onFieldChange(
                "pricingSummary",
                event.target.value,
              )
            }
            rows={3}
            className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            NDIS registration
          </span>

          <select
            value={
              form.ndisRegistrationStatus
            }
            onChange={(event) =>
              onFieldChange(
                "ndisRegistrationStatus",
                event.target
                  .value as CommunityServiceNdisRegistrationStatus,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          >
            {Object.entries(
              NDIS_STATUS_LABELS,
            ).map(
              ([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-[#d6c6b1] px-4 py-3">
          <input
            type="checkbox"
            checked={
              form.acceptsNdisFunding
            }
            onChange={(event) =>
              onFieldChange(
                "acceptsNdisFunding",
                event.target.checked,
              )
            }
          />

          <span className="font-medium text-[#6f5947]">
            Accepts NDIS funding
          </span>
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            ABN
          </span>

          <input
            value={form.abn}
            onChange={(event) =>
              onFieldChange(
                "abn",
                event.target.value,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Website
          </span>

          <input
            value={form.websiteUrl}
            onChange={(event) =>
              onFieldChange(
                "websiteUrl",
                event.target.value,
              )
            }
            placeholder="https://"
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Public email
          </span>

          <input
            type="email"
            value={form.publicEmail}
            onChange={(event) =>
              onFieldChange(
                "publicEmail",
                event.target.value,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium text-[#6f5947]">
            Public phone
          </span>

          <input
            value={form.publicPhone}
            onChange={(event) =>
              onFieldChange(
                "publicPhone",
                event.target.value,
              )
            }
            className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={working}
          className="rounded-full border border-[#d6c6b1] px-5 py-3 font-medium text-[#60432f]"
        >
          Save draft
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={working}
          className="rounded-full bg-[#60432f] px-5 py-3 font-medium text-white"
        >
          Submit for moderation
        </button>
      </div>
    </section>
  );
}

export default function CommunityServicesDirectory({
  signedIn,
}: CommunityServicesDirectoryProps) {
  const directory =
    useCommunityServicesDirectory({
      enabled: true,
      signedIn,
    });

  const [
    activeAction,
    setActiveAction,
  ] = useState<
    | "details"
    | "enquiry"
    | "circle"
    | "response"
  >("details");

  const availableModes =
    useMemo(() => {
      const modes:
        CommunityServicesDirectoryMode[] =
          ["browse"];

      if (signedIn) {
        modes.push(
          "saved",
          "my-listings",
        );
      }

      if (directory.isModerator) {
        modes.push("moderation");
      }

      return modes;
    }, [
      directory.isModerator,
      signedIn,
    ]);

  const showListingEditor =
    directory.mode ===
      "my-listings" &&
    signedIn;

  const showModerationEditor =
    directory.mode ===
      "moderation" &&
    directory.isModerator &&
    directory.moderationForm
      .listingId;

  return (
    <main className="min-h-screen bg-[#eee4d7] px-4 py-8 text-[#49392d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[30px] border border-[#d7c6b0] bg-[rgba(255,250,241,0.96)] p-6 shadow-[0_24px_60px_rgba(70,48,31,0.12)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8b745d]">
            Smiling Monad Community
          </p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="font-serif text-4xl text-[#3f3025] sm:text-5xl">
                Services Directory
              </h1>

              <p className="mt-3 max-w-3xl text-lg leading-8 text-[#6b5d50]">
                Find trusted support,
                community and professional
                services without exposing
                private participant or
                Circle information.
              </p>
            </div>

            {signedIn ? (
              <button
                type="button"
                onClick={() => {
                  directory.setMode(
                    "my-listings",
                  );
                  directory.startNewListing();
                }}
                className="rounded-full bg-[#60432f] px-6 py-3 font-medium text-white transition hover:bg-[#4f3728]"
              >
                Add a service
              </button>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {availableModes.map(
              (mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    directory.setMode(
                      mode,
                    )
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    directory.mode ===
                    mode
                      ? "bg-[#60432f] text-white"
                      : "border border-[#d6c6b1] bg-white text-[#60432f]"
                  }`}
                >
                  {MODE_LABELS[mode]}

                  {mode ===
                  "saved"
                    ? ` (${directory.counts.saved})`
                    : ""}

                  {mode ===
                  "my-listings"
                    ? ` (${directory.counts.mine})`
                    : ""}

                  {mode ===
                  "moderation"
                    ? ` (${directory.counts.moderation})`
                    : ""}
                </button>
              ),
            )}
          </div>
        </header>

        {directory.mode ===
        "browse" ? (
          <section className="mt-6 rounded-[28px] border border-[#d7c6b0] bg-[rgba(255,250,241,0.96)] p-5 sm:p-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={
                  directory.filters
                    .query ?? ""
                }
                onChange={(event) =>
                  directory.setFilter(
                    "query",
                    event.target.value,
                  )
                }
                placeholder="Search services"
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />

              <select
                value={
                  directory.filters
                    .category ?? ""
                }
                onChange={(event) =>
                  directory.setFilter(
                    "category",
                    event.target
                      .value as CommunityServiceCategory | "",
                  )
                }
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              >
                <option value="">
                  All service types
                </option>

                {Object.entries(
                  CATEGORY_LABELS,
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>

              <input
                value={
                  directory.filters
                    .serviceArea ?? ""
                }
                onChange={(event) =>
                  directory.setFilter(
                    "serviceArea",
                    event.target.value,
                  )
                }
                placeholder="Location or service area"
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              />

              <select
                value={
                  directory.filters
                    .deliveryMethod ??
                  ""
                }
                onChange={(event) =>
                  directory.setFilter(
                    "deliveryMethod",
                    event.target
                      .value as CommunityServiceDeliveryMethod | "",
                  )
                }
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              >
                <option value="">
                  Any delivery method
                </option>

                {Object.entries(
                  DELIVERY_METHOD_LABELS,
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>

              <select
                value={
                  directory.filters
                    .ageGroup ?? ""
                }
                onChange={(event) =>
                  directory.setFilter(
                    "ageGroup",
                    event.target
                      .value as CommunityServiceAgeGroup | "",
                  )
                }
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              >
                <option value="">
                  Any age group
                </option>

                {Object.entries(
                  AGE_GROUP_LABELS,
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>

              <select
                value={
                  directory.filters
                    .ndisRegistrationStatus ??
                  ""
                }
                onChange={(event) =>
                  directory.setFilter(
                    "ndisRegistrationStatus",
                    event.target
                      .value as CommunityServiceNdisRegistrationStatus | "",
                  )
                }
                className="rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
              >
                <option value="">
                  Any NDIS status
                </option>

                {Object.entries(
                  NDIS_STATUS_LABELS,
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>

              <label className="flex items-center gap-3 rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    directory.filters
                      .acceptsNdisFunding ===
                    true
                  }
                  onChange={(event) =>
                    directory.setFilter(
                      "acceptsNdisFunding",
                      event.target
                        .checked,
                    )
                  }
                />

                <span className="text-sm font-medium text-[#60432f]">
                  Accepts NDIS funding
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    directory.filters
                      .verifiedOnly ===
                    true
                  }
                  onChange={(event) =>
                    directory.setFilter(
                      "verifiedOnly",
                      event.target
                        .checked,
                    )
                  }
                />

                <span className="text-sm font-medium text-[#60432f]">
                  Verified only
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={
                directory.resetFilters
              }
              className="mt-4 text-sm font-medium text-[#806b59]"
            >
              Clear filters
            </button>
          </section>
        ) : null}

        {directory.message ? (
          <p className="mt-5 rounded-[20px] border border-[#dfd2c1] bg-[#fffaf1] px-5 py-4 text-[#6b5d50]">
            {directory.message}
          </p>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section>
            {directory.loading ||
            directory.privateLoading ? (
              <div className="rounded-[24px] border border-[#d7c6b0] bg-[#fffaf1] p-8 text-center text-[#756151]">
                Loading services…
              </div>
            ) : null}

            {!directory.loading &&
            !directory.privateLoading &&
            directory.listings.length ===
              0 ? (
              <div className="rounded-[24px] border border-dashed border-[#cdbba4] bg-[#fffaf1] p-8 text-center text-[#756151]">
                No services match this
                view yet.
              </div>
            ) : null}

            <div className="space-y-4">
              {directory.listings.map(
                (listing) => {
                  const isOwner =
                    directory.myListings.some(
                      (item) =>
                        item.id ===
                        listing.id,
                    );

                  const canSubmit =
                    isOwner &&
                    [
                      "draft",
                      "rejected",
                    ].includes(
                      listing.moderation_status,
                    );

                  return (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      saved={directory.savedListingIds.includes(
                        listing.id,
                      )}
                      working={Boolean(
                        directory.workingId,
                      )}
                      canSave={
                        signedIn &&
                        listing.moderation_status ===
                          "approved"
                      }
                      onSelect={() => {
                        directory.selectListing(
                          listing,
                        );
                        setActiveAction(
                          "details",
                        );
                      }}
                      onToggleSaved={() => {
                        void directory.toggleSavedListing(
                          listing.id,
                        );
                      }}
                      onEdit={
                        isOwner
                          ? () =>
                              directory.editListing(
                                listing,
                              )
                          : undefined
                      }
                      onSubmit={
                        canSubmit
                          ? () => {
                              void directory.submitListing(
                                listing.id,
                              );
                            }
                          : undefined
                      }
                      onReview={
                        directory.mode ===
                          "moderation" &&
                        directory.isModerator
                          ? () =>
                              directory.startModerationReview(
                                listing,
                              )
                          : undefined
                      }
                    />
                  );
                },
              )}
            </div>
          </section>

          <div className="space-y-6">
            {showListingEditor ? (
              <ListingEditor
                form={
                  directory.listingForm
                }
                working={Boolean(
                  directory.workingId,
                )}
                onFieldChange={
                  directory.setListingFormField
                }
                onSaveDraft={() => {
                  void directory.saveListing(
                    false,
                  );
                }}
                onSubmit={() => {
                  void directory.saveListing(
                    true,
                  );
                }}
              />
            ) : null}

            {showModerationEditor ? (
              <section className="rounded-[28px] border border-[#dfd2c1] bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
                  Moderation review
                </p>

                <h2 className="mt-3 font-serif text-3xl text-[#4f3728]">
                  Review service listing
                </h2>

                <div className="mt-6 space-y-4">
                  <label>
                    <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                      Decision
                    </span>

                    <select
                      value={
                        directory.moderationForm
                          .decision
                      }
                      onChange={(event) =>
                        directory.setModerationFormField(
                          "decision",
                          event.target
                            .value as CommunityServiceReviewDecision,
                        )
                      }
                      className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    >
                      <option value="approved">
                        Approve
                      </option>

                      <option value="rejected">
                        Reject
                      </option>

                      <option value="suspended">
                        Suspend
                      </option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                      Verification
                    </span>

                    <select
                      value={
                        directory.moderationForm
                          .verificationStatus
                      }
                      onChange={(event) =>
                        directory.setModerationFormField(
                          "verificationStatus",
                          event.target
                            .value as CommunityServiceVerificationStatus | "",
                        )
                      }
                      className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    >
                      <option value="">
                        Leave unchanged
                      </option>

                      {Object.entries(
                        VERIFICATION_LABELS,
                      ).map(
                        ([
                          value,
                          label,
                        ]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                      Review due
                    </span>

                    <input
                      type="date"
                      value={
                        directory.moderationForm
                          .reviewDueAt
                      }
                      onChange={(event) =>
                        directory.setModerationFormField(
                          "reviewDueAt",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-sm font-medium text-[#6f5947]">
                      Reason or moderation notes
                    </span>

                    <textarea
                      value={
                        directory.moderationForm
                          .reason
                      }
                      onChange={(event) =>
                        directory.setModerationFormField(
                          "reason",
                          event.target.value,
                        )
                      }
                      rows={5}
                      className="w-full resize-y rounded-2xl border border-[#d6c6b1] bg-white px-4 py-3 outline-none focus:border-[#71523b]"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      void directory.saveModerationReview();
                    }}
                    disabled={Boolean(
                      directory.workingId,
                    )}
                    className="w-full rounded-full bg-[#60432f] px-6 py-3 font-medium text-white disabled:opacity-60"
                  >
                    Save moderation decision
                  </button>
                </div>
              </section>
            ) : null}

            {!showListingEditor &&
            !showModerationEditor &&
            activeAction ===
              "enquiry" &&
            directory.enquiryForm
              .listingId ? (
              <EnquiryComposer
                form={
                  directory.enquiryForm
                }
                working={Boolean(
                  directory.workingId,
                )}
                onFieldChange={
                  directory.setEnquiryFormField
                }
                onSend={() => {
                  void directory.sendServiceEnquiry();
                }}
                onCancel={() =>
                  setActiveAction(
                    "details",
                  )
                }
              />
            ) : null}

            {!showListingEditor &&
            !showModerationEditor &&
            activeAction === "circle" &&
            directory.circleSaveForm
              .listingId ? (
              <CircleSaveComposer
                form={
                  directory.circleSaveForm
                }
                circles={
                  directory.circleDirectory
                }
                working={Boolean(
                  directory.workingId,
                )}
                saved={
                  directory.lastCircleSave
                }
                onFieldChange={
                  directory.setCircleSaveFormField
                }
                onSave={() => {
                  void directory.saveServiceToCircle();
                }}
                onRemove={(saveId) => {
                  void directory.removeServiceFromCircle(
                    saveId,
                  );
                }}
                onCancel={() =>
                  setActiveAction(
                    "details",
                  )
                }
              />
            ) : null}

            {!showListingEditor &&
            !showModerationEditor &&
            activeAction ===
              "response" &&
            directory.selectedEnquiry ? (
              <ProviderResponseComposer
                enquiry={
                  directory.selectedEnquiry
                }
                form={
                  directory.responseForm
                }
                working={Boolean(
                  directory.workingId,
                )}
                onFieldChange={
                  directory.setResponseFormField
                }
                onSend={() => {
                  void directory.sendProviderResponse();
                }}
                onCancel={() =>
                  setActiveAction(
                    "details",
                  )
                }
              />
            ) : null}

            {!showListingEditor &&
            !showModerationEditor &&
            activeAction ===
              "details" &&
            directory.selectedListing ? (
              <ListingDetails
                listing={
                  directory.selectedListing
                }
                signedIn={signedIn}
                onEnquire={() => {
                  directory.startServiceEnquiry(
                    directory.selectedListing!,
                  );
                  setActiveAction(
                    "enquiry",
                  );
                }}
                onSaveToCircle={() => {
                  directory.startCircleSave(
                    directory.selectedListing!,
                  );
                  setActiveAction(
                    "circle",
                  );
                }}
              />
            ) : null}

            {!showListingEditor &&
            !showModerationEditor &&
            activeAction ===
              "details" &&
            !directory.selectedListing ? (
              <section className="rounded-[28px] border border-dashed border-[#cdbba4] bg-[#fffaf1] p-8 text-center text-[#756151]">
                Select a service to view
                its full profile.
              </section>
            ) : null}
          </div>
        </div>
      </div>

      {signedIn ? (
        <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[#d7c6b0] bg-[rgba(255,250,241,0.96)] p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
                  Private
                </p>

                <h2 className="mt-2 font-serif text-3xl text-[#4f3728]">
                  My enquiries
                </h2>
              </div>

              <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-sm text-[#6f5947]">
                {
                  directory.counts
                    .sentEnquiries
                }
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {directory.myEnquiries.length ===
              0 ? (
                <p className="rounded-[20px] border border-dashed border-[#cdbba4] p-5 text-[#756151]">
                  You have not sent any
                  service enquiries.
                </p>
              ) : (
                directory.myEnquiries.map(
                  (enquiry) => (
                    <EnquirySummary
                      key={enquiry.id}
                      enquiry={enquiry}
                      received={false}
                      working={Boolean(
                        directory.workingId,
                      )}
                      onWithdraw={() => {
                        void directory.withdrawEnquiry(
                          enquiry.id,
                        );
                      }}
                    />
                  ),
                )
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d7c6b0] bg-[rgba(255,250,241,0.96)] p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b745d]">
                  Provider tools
                </p>

                <h2 className="mt-2 font-serif text-3xl text-[#4f3728]">
                  Enquiry inbox
                </h2>
              </div>

              <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-sm text-[#6f5947]">
                {
                  directory.counts
                    .openReceivedEnquiries
                }{" "}
                open
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {directory.receivedEnquiries
                .length === 0 ? (
                <p className="rounded-[20px] border border-dashed border-[#cdbba4] p-5 text-[#756151]">
                  No enquiries have been
                  received for your service
                  listings.
                </p>
              ) : (
                directory.receivedEnquiries.map(
                  (enquiry) => (
                    <EnquirySummary
                      key={enquiry.id}
                      enquiry={enquiry}
                      received
                      working={Boolean(
                        directory.workingId,
                      )}
                      onRespond={() => {
                        directory.startProviderResponse(
                          enquiry,
                        );
                        setActiveAction(
                          "response",
                        );
                        window.scrollTo({
                          top: 0,
                          behavior:
                            "smooth",
                        });
                      }}
                    />
                  ),
                )
              )}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}