"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createCommunityServiceListing,
  isCommunityServiceModerator,
  readApprovedCommunityServiceListings,
  readCommunityServiceModerationQueue,
  readMyCommunityServiceListings,
  readSavedCommunityServiceListingIds,
  reviewCommunityServiceListing,
  saveCommunityServiceListing,
  submitCommunityServiceListing,
  unsaveCommunityServiceListing,
  updateCommunityServiceListing,
  type CommunityServiceAgeGroup,
  type CommunityServiceCategory,
  type CommunityServiceDeliveryMethod,
  type CommunityServiceDirectoryFilters,
  type CommunityServiceListing,
  type CommunityServiceListingInput,
  type CommunityServiceNdisRegistrationStatus,
  type CommunityServiceProviderType,
  type CommunityServiceReviewDecision,
  type CommunityServiceVerificationStatus,
} from "@/lib/community/secure-community-services-client";

export type CommunityServicesDirectoryMode =
  | "browse"
  | "saved"
  | "my-listings"
  | "moderation";

export type CommunityServiceListingForm = {
  id: string;
  providerType:
    CommunityServiceProviderType;
  organisationName: string;
  serviceName: string;
  serviceCategory:
    CommunityServiceCategory;
  summary: string;
  description: string;
  serviceAreas: string;
  deliveryMethods:
    CommunityServiceDeliveryMethod[];
  ageGroups:
    CommunityServiceAgeGroup[];
  accessibilityFeatures: string;
  languages: string;
  availabilitySummary: string;
  pricingSummary: string;
  acceptsNdisFunding: boolean;
  ndisRegistrationStatus:
    CommunityServiceNdisRegistrationStatus;
  abn: string;
  websiteUrl: string;
  publicEmail: string;
  publicPhone: string;
};

export type CommunityServiceModerationForm = {
  listingId: string;
  decision:
    CommunityServiceReviewDecision;
  reason: string;
  verificationStatus:
    CommunityServiceVerificationStatus | "";
  reviewDueAt: string;
};

type UseCommunityServicesDirectoryOptions = {
  enabled?: boolean;
  signedIn?: boolean;
};

function describeError(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function commaSeparatedValues(
  value: string,
): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) =>
          item.trim(),
        )
        .filter(Boolean),
    ),
  );
}

function createEmptyListingForm():
  CommunityServiceListingForm {
  return {
    id: "",
    providerType: "organisation",
    organisationName: "",
    serviceName: "",
    serviceCategory: "support_work",
    summary: "",
    description: "",
    serviceAreas: "",
    deliveryMethods: ["in_person"],
    ageGroups: ["adults"],
    accessibilityFeatures: "",
    languages: "English",
    availabilitySummary: "",
    pricingSummary: "",
    acceptsNdisFunding: false,
    ndisRegistrationStatus:
      "not_stated",
    abn: "",
    websiteUrl: "",
    publicEmail: "",
    publicPhone: "",
  };
}

function createEmptyModerationForm():
  CommunityServiceModerationForm {
  return {
    listingId: "",
    decision: "approved",
    reason: "",
    verificationStatus: "",
    reviewDueAt: "",
  };
}

function listingToForm(
  listing: CommunityServiceListing,
): CommunityServiceListingForm {
  return {
    id: listing.id,
    providerType:
      listing.provider_type,
    organisationName:
      listing.organisation_name,
    serviceName:
      listing.service_name,
    serviceCategory:
      listing.service_category,
    summary: listing.summary,
    description: listing.description,
    serviceAreas:
      listing.service_areas.join(", "),
    deliveryMethods:
      listing.delivery_methods,
    ageGroups:
      listing.age_groups,
    accessibilityFeatures:
      listing.accessibility_features.join(
        ", ",
      ),
    languages:
      listing.languages.join(", "),
    availabilitySummary:
      listing.availability_summary,
    pricingSummary:
      listing.pricing_summary,
    acceptsNdisFunding:
      listing.accepts_ndis_funding,
    ndisRegistrationStatus:
      listing.ndis_registration_status,
    abn: listing.abn,
    websiteUrl:
      listing.website_url,
    publicEmail:
      listing.public_email,
    publicPhone:
      listing.public_phone,
  };
}

function formToInput(
  form:
    CommunityServiceListingForm,
): CommunityServiceListingInput {
  return {
    providerType:
      form.providerType,
    organisationName:
      form.organisationName,
    serviceName:
      form.serviceName,
    serviceCategory:
      form.serviceCategory,
    summary: form.summary,
    description:
      form.description,
    serviceAreas:
      commaSeparatedValues(
        form.serviceAreas,
      ),
    deliveryMethods:
      form.deliveryMethods,
    ageGroups:
      form.ageGroups,
    accessibilityFeatures:
      commaSeparatedValues(
        form.accessibilityFeatures,
      ),
    languages:
      commaSeparatedValues(
        form.languages,
      ),
    availabilitySummary:
      form.availabilitySummary,
    pricingSummary:
      form.pricingSummary,
    acceptsNdisFunding:
      form.acceptsNdisFunding,
    ndisRegistrationStatus:
      form.ndisRegistrationStatus,
    abn: form.abn,
    websiteUrl:
      form.websiteUrl,
    publicEmail:
      form.publicEmail,
    publicPhone:
      form.publicPhone,
  };
}

export default function useCommunityServicesDirectory({
  enabled = true,
  signedIn = false,
}: UseCommunityServicesDirectoryOptions = {}) {
  const [mode, setMode] =
    useState<CommunityServicesDirectoryMode>(
      "browse",
    );

  const [filters, setFilters] =
    useState<CommunityServiceDirectoryFilters>({
      query: "",
      providerType: "",
      category: "",
      serviceArea: "",
      deliveryMethod: "",
      ageGroup: "",
      acceptsNdisFunding: false,
      ndisRegistrationStatus: "",
      verifiedOnly: false,
      limit: 50,
    });

  const [
    approvedListings,
    setApprovedListings,
  ] = useState<
    CommunityServiceListing[]
  >([]);

  const [
    savedListingIds,
    setSavedListingIds,
  ] = useState<string[]>([]);

  const [
    myListings,
    setMyListings,
  ] = useState<
    CommunityServiceListing[]
  >([]);

  const [
    moderationQueue,
    setModerationQueue,
  ] = useState<
    CommunityServiceListing[]
  >([]);

  const [
    isModerator,
    setIsModerator,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    privateLoading,
    setPrivateLoading,
  ] = useState(false);

  const [workingId, setWorkingId] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    selectedListingId,
    setSelectedListingId,
  ] = useState("");

  const [
    listingForm,
    setListingForm,
  ] = useState<
    CommunityServiceListingForm
  >(() =>
    createEmptyListingForm(),
  );

  const [
    moderationForm,
    setModerationForm,
  ] = useState<
    CommunityServiceModerationForm
  >(() =>
    createEmptyModerationForm(),
  );

  const loadApprovedListings =
    useCallback(async () => {
      if (!enabled) {
        setApprovedListings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const listings =
          await readApprovedCommunityServiceListings(
            filters,
          );

        setApprovedListings(
          listings,
        );
      } catch (error) {
        setMessage(
          describeError(
            error,
            "The Services Directory could not be loaded.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [enabled, filters]);

  const loadPrivateDirectory =
    useCallback(async () => {
      if (
        !enabled ||
        !signedIn
      ) {
        setSavedListingIds([]);
        setMyListings([]);
        setModerationQueue([]);
        setIsModerator(false);
        setPrivateLoading(false);
        return;
      }

      setPrivateLoading(true);

      try {
        const [
          savedIds,
          ownedListings,
          moderator,
        ] = await Promise.all([
          readSavedCommunityServiceListingIds(),
          readMyCommunityServiceListings(),
          isCommunityServiceModerator(),
        ]);

        setSavedListingIds(
          savedIds,
        );

        setMyListings(
          ownedListings,
        );

        setIsModerator(
          moderator,
        );

        if (moderator) {
          const queue =
            await readCommunityServiceModerationQueue();

          setModerationQueue(
            queue,
          );
        } else {
          setModerationQueue(
            [],
          );
        }
      } catch (error) {
        setMessage(
          describeError(
            error,
            "Your Services Directory information could not be loaded.",
          ),
        );
      } finally {
        setPrivateLoading(false);
      }
    }, [
      enabled,
      signedIn,
    ]);

  useEffect(() => {
    void loadApprovedListings();
  }, [loadApprovedListings]);

  useEffect(() => {
    void loadPrivateDirectory();
  }, [loadPrivateDirectory]);

  const selectedListing =
    useMemo(() => {
      const allListings = [
        ...approvedListings,
        ...myListings,
        ...moderationQueue,
      ];

      return (
        allListings.find(
          (listing) =>
            listing.id ===
            selectedListingId,
        ) ?? null
      );
    }, [
      approvedListings,
      moderationQueue,
      myListings,
      selectedListingId,
    ]);

  const savedListings =
    useMemo(
      () =>
        approvedListings.filter(
          (listing) =>
            savedListingIds.includes(
              listing.id,
            ),
        ),
      [
        approvedListings,
        savedListingIds,
      ],
    );

  const visibleListings =
    useMemo(() => {
      if (mode === "saved") {
        return savedListings;
      }

      if (mode === "my-listings") {
        return myListings;
      }

      if (mode === "moderation") {
        return moderationQueue;
      }

      return approvedListings;
    }, [
      approvedListings,
      mode,
      moderationQueue,
      myListings,
      savedListings,
    ]);

  const submittedCount =
    useMemo(
      () =>
        myListings.filter(
          (listing) =>
            listing.moderation_status ===
            "submitted",
        ).length,
      [myListings],
    );

  const approvedCount =
    useMemo(
      () =>
        myListings.filter(
          (listing) =>
            listing.moderation_status ===
            "approved",
        ).length,
      [myListings],
    );

  const setFilter = useCallback(
    <
      Key extends
        keyof CommunityServiceDirectoryFilters,
    >(
      key: Key,
      value:
        CommunityServiceDirectoryFilters[Key],
    ) => {
      setFilters((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const resetFilters =
    useCallback(() => {
      setFilters({
        query: "",
        providerType: "",
        category: "",
        serviceArea: "",
        deliveryMethod: "",
        ageGroup: "",
        acceptsNdisFunding: false,
        ndisRegistrationStatus: "",
        verifiedOnly: false,
        limit: 50,
      });
    }, []);

  const selectListing =
    useCallback(
      (
        listing:
          CommunityServiceListing,
      ) => {
        setSelectedListingId(
          listing.id,
        );
        setMessage("");
      },
      [],
    );

  const startNewListing =
    useCallback(() => {
      setSelectedListingId("");
      setListingForm(
        createEmptyListingForm(),
      );
      setMessage("");
    }, []);

  const editListing =
    useCallback(
      (
        listing:
          CommunityServiceListing,
      ) => {
        setSelectedListingId(
          listing.id,
        );
        setListingForm(
          listingToForm(
            listing,
          ),
        );
        setMessage("");
      },
      [],
    );

  const setListingFormField =
    useCallback(
      <
        Key extends
          keyof CommunityServiceListingForm,
      >(
        key: Key,
        value:
          CommunityServiceListingForm[Key],
      ) => {
        setListingForm(
          (current) => ({
            ...current,
            [key]: value,
          }),
        );
      },
      [],
    );

  const saveListing =
    useCallback(
      async (
        submitForReview = false,
      ) => {
        if (
          !signedIn ||
          workingId
        ) {
          return;
        }

        const workId =
          listingForm.id || "new";

        setWorkingId(workId);
        setMessage("");

        try {
          const input =
            formToInput(
              listingForm,
            );

          const savedListing =
            listingForm.id
              ? await updateCommunityServiceListing(
                  listingForm.id,
                  input,
                  submitForReview,
                )
              : await createCommunityServiceListing(
                  input,
                  submitForReview,
                );

          setMyListings(
            (current) => {
              const exists =
                current.some(
                  (listing) =>
                    listing.id ===
                    savedListing.id,
                );

              if (!exists) {
                return [
                  savedListing,
                  ...current,
                ];
              }

              return current.map(
                (listing) =>
                  listing.id ===
                  savedListing.id
                    ? savedListing
                    : listing,
              );
            },
          );

          setSelectedListingId(
            savedListing.id,
          );

          setListingForm(
            listingToForm(
              savedListing,
            ),
          );

          setMessage(
            submitForReview
              ? "Service listing submitted for moderation."
              : "Service listing saved as a draft.",
          );
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The service listing could not be saved.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [
        listingForm,
        signedIn,
        workingId,
      ],
    );

  const submitListing =
    useCallback(
      async (listingId: string) => {
        if (
          !listingId ||
          workingId
        ) {
          return;
        }

        setWorkingId(
          listingId,
        );
        setMessage("");

        try {
          const submittedListing =
            await submitCommunityServiceListing(
              listingId,
            );

          setMyListings(
            (current) =>
              current.map(
                (listing) =>
                  listing.id ===
                  submittedListing.id
                    ? submittedListing
                    : listing,
              ),
          );

          setMessage(
            "Service listing submitted for moderation.",
          );
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The service listing could not be submitted.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [workingId],
    );

  const toggleSavedListing =
    useCallback(
      async (listingId: string) => {
        if (
          !signedIn ||
          !listingId ||
          workingId
        ) {
          return;
        }

        setWorkingId(
          `saved-${listingId}`,
        );
        setMessage("");

        const isSaved =
          savedListingIds.includes(
            listingId,
          );

        try {
          if (isSaved) {
            await unsaveCommunityServiceListing(
              listingId,
            );

            setSavedListingIds(
              (current) =>
                current.filter(
                  (id) =>
                    id !== listingId,
                ),
            );

            setMessage(
              "Service removed from saved services.",
            );
          } else {
            await saveCommunityServiceListing(
              listingId,
            );

            setSavedListingIds(
              (current) =>
                current.includes(
                  listingId,
                )
                  ? current
                  : [
                      listingId,
                      ...current,
                    ],
            );

            setMessage(
              "Service saved.",
            );
          }
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The saved service could not be updated.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [
        savedListingIds,
        signedIn,
        workingId,
      ],
    );

  const startModerationReview =
    useCallback(
      (
        listing:
          CommunityServiceListing,
      ) => {
        setSelectedListingId(
          listing.id,
        );

        setModerationForm({
          listingId:
            listing.id,
          decision:
            "approved",
          reason: "",
          verificationStatus:
            listing.verification_status ===
            "verified"
              ? "verified"
              : "",
          reviewDueAt:
            listing.review_due_at ??
            "",
        });

        setMessage("");
      },
      [],
    );

  const setModerationFormField =
    useCallback(
      <
        Key extends
          keyof CommunityServiceModerationForm,
      >(
        key: Key,
        value:
          CommunityServiceModerationForm[Key],
      ) => {
        setModerationForm(
          (current) => ({
            ...current,
            [key]: value,
          }),
        );
      },
      [],
    );

  const saveModerationReview =
    useCallback(async () => {
      if (
        !isModerator ||
        !moderationForm.listingId ||
        workingId
      ) {
        return;
      }

      setWorkingId(
        moderationForm.listingId,
      );
      setMessage("");

      try {
        const reviewedListing =
          await reviewCommunityServiceListing(
            {
              listingId:
                moderationForm.listingId,
              decision:
                moderationForm.decision,
              reason:
                moderationForm.reason,
              verificationStatus:
                moderationForm.verificationStatus ||
                null,
              reviewDueAt:
                moderationForm.reviewDueAt ||
                null,
            },
          );

        setModerationQueue(
          (current) =>
            current.filter(
              (listing) =>
                listing.id !==
                reviewedListing.id,
            ),
        );

        setApprovedListings(
          (current) => {
            const withoutListing =
              current.filter(
                (listing) =>
                  listing.id !==
                  reviewedListing.id,
              );

            return reviewedListing.moderation_status ===
              "approved"
              ? [
                  reviewedListing,
                  ...withoutListing,
                ]
              : withoutListing;
          },
        );

        setModerationForm(
          createEmptyModerationForm(),
        );

        setSelectedListingId(
          reviewedListing.id,
        );

        setMessage(
          `Service listing ${reviewedListing.moderation_status}.`,
        );
      } catch (error) {
        setMessage(
          describeError(
            error,
            "The moderation review could not be saved.",
          ),
        );
      } finally {
        setWorkingId("");
      }
    }, [
      isModerator,
      moderationForm,
      workingId,
    ]);

  return {
    mode,
    setMode,

    filters,
    setFilter,
    resetFilters,

    listings:
      visibleListings,
    approvedListings,
    savedListings,
    myListings,
    moderationQueue,

    savedListingIds,
    isModerator,

    loading,
    privateLoading,
    workingId,
    message,

    selectedListing,
    selectedListingId,
    selectListing,

    listingForm,
    setListingFormField,
    startNewListing,
    editListing,
    saveListing,
    submitListing,

    toggleSavedListing,

    moderationForm,
    setModerationFormField,
    startModerationReview,
    saveModerationReview,

    counts: {
      public:
        approvedListings.length,
      saved:
        savedListingIds.length,
      mine:
        myListings.length,
      submitted:
        submittedCount,
      approved:
        approvedCount,
      moderation:
        moderationQueue.length,
    },

    refresh: async () => {
      await Promise.all([
        loadApprovedListings(),
        loadPrivateDirectory(),
      ]);
    },
  };
}