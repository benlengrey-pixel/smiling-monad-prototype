"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listMySecureCircles,
  type SecureCircleDirectoryEntry,
} from "@/lib/circle/secure-circle-directory-client";

import {
  createCommunityServiceEnquiry,
  createCommunityServiceListing,
  isCommunityServiceModerator,
  readApprovedCommunityServiceListings,
  readCommunityServiceModerationQueue,
  readMyCommunityServiceEnquiries,
  readMyCommunityServiceListings,
  readReceivedCommunityServiceEnquiries,
  readSavedCommunityServiceListingIds,
  removeCommunityServiceFromCircle,
  respondToCommunityServiceEnquiry,
  reviewCommunityServiceListing,
  saveCommunityServiceListing,
  saveCommunityServiceToCircle,
  submitCommunityServiceListing,
  unsaveCommunityServiceListing,
  updateCommunityServiceListing,
  withdrawCommunityServiceEnquiry,
  type CommunityServiceAgeGroup,
  type CommunityServiceCategory,
  type CommunityServiceCircleSave,
  type CommunityServiceDeliveryMethod,
  type CommunityServiceDirectoryFilters,
  type CommunityServiceEnquiry,
  type CommunityServiceListing,
  type CommunityServiceListingInput,
  type CommunityServiceNdisRegistrationStatus,
  type CommunityServicePreferredContactMethod,
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

export type CommunityServiceEnquiryForm = {
  listingId: string;
  serviceName: string;
  subject: string;
  message: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredContactMethod:
    CommunityServicePreferredContactMethod;
  consentToShareContact: boolean;
};

export type CommunityServiceResponseForm = {
  enquiryId: string;
  response: string;
  closeAfterResponse: boolean;
};

export type CommunityServiceCircleSaveForm = {
  listingId: string;
  serviceName: string;
  circleId: string;
  participantId: string;
  note: string;
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

function createEmptyEnquiryForm():
  CommunityServiceEnquiryForm {
  return {
    listingId: "",
    serviceName: "",
    subject: "",
    message: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    preferredContactMethod:
      "platform",
    consentToShareContact:
      false,
  };
}

function createEmptyResponseForm():
  CommunityServiceResponseForm {
  return {
    enquiryId: "",
    response: "",
    closeAfterResponse:
      false,
  };
}

function createEmptyCircleSaveForm():
  CommunityServiceCircleSaveForm {
  return {
    listingId: "",
    serviceName: "",
    circleId: "",
    participantId: "",
    note: "",
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

  const [
    myEnquiries,
    setMyEnquiries,
  ] = useState<
    CommunityServiceEnquiry[]
  >([]);

  const [
    receivedEnquiries,
    setReceivedEnquiries,
  ] = useState<
    CommunityServiceEnquiry[]
  >([]);

  const [
    selectedEnquiryId,
    setSelectedEnquiryId,
  ] = useState("");

  const [
    enquiryForm,
    setEnquiryForm,
  ] = useState<
    CommunityServiceEnquiryForm
  >(() =>
    createEmptyEnquiryForm(),
  );

  const [
    responseForm,
    setResponseForm,
  ] = useState<
    CommunityServiceResponseForm
  >(() =>
    createEmptyResponseForm(),
  );

  const [
    circleSaveForm,
    setCircleSaveForm,
  ] = useState<
    CommunityServiceCircleSaveForm
  >(() =>
    createEmptyCircleSaveForm(),
  );

  const [
    lastCircleSave,
    setLastCircleSave,
  ] = useState<
    CommunityServiceCircleSave | null
  >(null);

  const [
    circleDirectory,
    setCircleDirectory,
  ] = useState<
    SecureCircleDirectoryEntry[]
  >([]);

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
        setMyEnquiries([]);
        setReceivedEnquiries([]);
        setCircleDirectory([]);
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
          sentEnquiries,
          incomingEnquiries,
          circles,
        ] = await Promise.all([
          readSavedCommunityServiceListingIds(),
          readMyCommunityServiceListings(),
          isCommunityServiceModerator(),
          readMyCommunityServiceEnquiries(),
          readReceivedCommunityServiceEnquiries(),
          listMySecureCircles(),
        ]);

        setSavedListingIds(
          savedIds,
        );

        setMyListings(
          ownedListings,
        );

        setMyEnquiries(
          sentEnquiries,
        );

        setReceivedEnquiries(
          incomingEnquiries,
        );

        setCircleDirectory(
          circles,
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

  const selectedEnquiry =
    useMemo(() => {
      const allEnquiries = [
        ...myEnquiries,
        ...receivedEnquiries,
      ];

      return (
        allEnquiries.find(
          (enquiry) =>
            enquiry.id ===
            selectedEnquiryId,
        ) ?? null
      );
    }, [
      myEnquiries,
      receivedEnquiries,
      selectedEnquiryId,
    ]);

  const startServiceEnquiry =
    useCallback(
      (
        listing:
          CommunityServiceListing,
      ) => {
        setSelectedListingId(
          listing.id,
        );

        setEnquiryForm({
          ...createEmptyEnquiryForm(),
          listingId:
            listing.id,
          serviceName:
            listing.service_name,
          subject:
            `Enquiry about ${listing.service_name}`,
        });

        setMessage("");
      },
      [],
    );

  const setEnquiryFormField =
    useCallback(
      <
        Key extends
          keyof CommunityServiceEnquiryForm,
      >(
        key: Key,
        value:
          CommunityServiceEnquiryForm[Key],
      ) => {
        setEnquiryForm(
          (current) => ({
            ...current,
            [key]: value,
          }),
        );
      },
      [],
    );

  const sendServiceEnquiry =
    useCallback(async () => {
      if (
        !signedIn ||
        !enquiryForm.listingId ||
        workingId
      ) {
        return;
      }

      setWorkingId(
        `enquiry-${enquiryForm.listingId}`,
      );
      setMessage("");

      try {
        const enquiry =
          await createCommunityServiceEnquiry(
            {
              listingId:
                enquiryForm.listingId,
              subject:
                enquiryForm.subject,
              message:
                enquiryForm.message,
              contactName:
                enquiryForm.contactName,
              contactEmail:
                enquiryForm.contactEmail,
              contactPhone:
                enquiryForm.contactPhone,
              preferredContactMethod:
                enquiryForm.preferredContactMethod,
              consentToShareContact:
                enquiryForm.consentToShareContact,
            },
          );

        setMyEnquiries(
          (current) => [
            enquiry,
            ...current,
          ],
        );

        setSelectedEnquiryId(
          enquiry.id,
        );

        setEnquiryForm(
          createEmptyEnquiryForm(),
        );

        setMessage(
          "Your private enquiry was sent to the service.",
        );
      } catch (error) {
        setMessage(
          describeError(
            error,
            "The service enquiry could not be sent.",
          ),
        );
      } finally {
        setWorkingId("");
      }
    }, [
      enquiryForm,
      signedIn,
      workingId,
    ]);

  const selectEnquiry =
    useCallback(
      (
        enquiry:
          CommunityServiceEnquiry,
      ) => {
        setSelectedEnquiryId(
          enquiry.id,
        );
        setMessage("");
      },
      [],
    );

  const withdrawEnquiry =
    useCallback(
      async (enquiryId: string) => {
        if (
          !enquiryId ||
          workingId
        ) {
          return;
        }

        setWorkingId(
          `withdraw-${enquiryId}`,
        );
        setMessage("");

        try {
          const withdrawn =
            await withdrawCommunityServiceEnquiry(
              enquiryId,
            );

          setMyEnquiries(
            (current) =>
              current.map(
                (enquiry) =>
                  enquiry.id ===
                  withdrawn.id
                    ? withdrawn
                    : enquiry,
              ),
          );

          setMessage(
            "The service enquiry was withdrawn.",
          );
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The service enquiry could not be withdrawn.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [workingId],
    );

  const startProviderResponse =
    useCallback(
      (
        enquiry:
          CommunityServiceEnquiry,
      ) => {
        setSelectedEnquiryId(
          enquiry.id,
        );

        setResponseForm({
          enquiryId:
            enquiry.id,
          response:
            enquiry.provider_response,
          closeAfterResponse:
            enquiry.enquiry_status ===
            "closed",
        });

        setMessage("");
      },
      [],
    );

  const setResponseFormField =
    useCallback(
      <
        Key extends
          keyof CommunityServiceResponseForm,
      >(
        key: Key,
        value:
          CommunityServiceResponseForm[Key],
      ) => {
        setResponseForm(
          (current) => ({
            ...current,
            [key]: value,
          }),
        );
      },
      [],
    );

  const sendProviderResponse =
    useCallback(async () => {
      if (
        !responseForm.enquiryId ||
        workingId
      ) {
        return;
      }

      setWorkingId(
        `response-${responseForm.enquiryId}`,
      );
      setMessage("");

      try {
        const responded =
          await respondToCommunityServiceEnquiry(
            {
              enquiryId:
                responseForm.enquiryId,
              response:
                responseForm.response,
              close:
                responseForm.closeAfterResponse,
            },
          );

        setReceivedEnquiries(
          (current) =>
            current.map(
              (enquiry) =>
                enquiry.id ===
                responded.id
                  ? responded
                  : enquiry,
            ),
        );

        setSelectedEnquiryId(
          responded.id,
        );

        setResponseForm(
          createEmptyResponseForm(),
        );

        setMessage(
          responseForm.closeAfterResponse
            ? "The provider response was sent and the enquiry was closed."
            : "The provider response was sent.",
        );
      } catch (error) {
        setMessage(
          describeError(
            error,
            "The provider response could not be sent.",
          ),
        );
      } finally {
        setWorkingId("");
      }
    }, [
      responseForm,
      workingId,
    ]);

  const startCircleSave =
    useCallback(
      (
        listing:
          CommunityServiceListing,
      ) => {
        setSelectedListingId(
          listing.id,
        );

        setCircleSaveForm({
          ...createEmptyCircleSaveForm(),
          listingId:
            listing.id,
          serviceName:
            listing.service_name,
        });

        setLastCircleSave(null);
        setMessage("");
      },
      [],
    );

  const setCircleSaveFormField =
    useCallback(
      <
        Key extends
          keyof CommunityServiceCircleSaveForm,
      >(
        key: Key,
        value:
          CommunityServiceCircleSaveForm[Key],
      ) => {
        setCircleSaveForm(
          (current) => ({
            ...current,
            [key]: value,
          }),
        );
      },
      [],
    );

  const saveServiceToCircle =
    useCallback(async () => {
      if (
        !signedIn ||
        !circleSaveForm.listingId ||
        !circleSaveForm.circleId ||
        !circleSaveForm.participantId ||
        workingId
      ) {
        return;
      }

      setWorkingId(
        `circle-${circleSaveForm.listingId}`,
      );
      setMessage("");

      try {
        const save =
          await saveCommunityServiceToCircle(
            {
              listingId:
                circleSaveForm.listingId,
              circleId:
                circleSaveForm.circleId,
              participantId:
                circleSaveForm.participantId,
              note:
                circleSaveForm.note,
            },
          );

        setLastCircleSave(
          save,
        );

        setMessage(
          "The service was saved privately to the selected Circle.",
        );
      } catch (error) {
        setMessage(
          describeError(
            error,
            "The service could not be saved to the Circle.",
          ),
        );
      } finally {
        setWorkingId("");
      }
    }, [
      circleSaveForm,
      signedIn,
      workingId,
    ]);

  const removeServiceFromCircle =
    useCallback(
      async (saveId: string) => {
        if (
          !saveId ||
          workingId
        ) {
          return;
        }

        setWorkingId(
          `remove-circle-${saveId}`,
        );
        setMessage("");

        try {
          const removed =
            await removeCommunityServiceFromCircle(
              saveId,
            );

          if (
            lastCircleSave?.id ===
            removed.id
          ) {
            setLastCircleSave(
              removed,
            );
          }

          setMessage(
            "The service was removed from the Circle.",
          );
        } catch (error) {
          setMessage(
            describeError(
              error,
              "The service could not be removed from the Circle.",
            ),
          );
        } finally {
          setWorkingId("");
        }
      },
      [
        lastCircleSave,
        workingId,
      ],
    );

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

    myEnquiries,
    receivedEnquiries,
    selectedEnquiry,
    selectedEnquiryId,
    selectEnquiry,

    enquiryForm,
    setEnquiryFormField,
    startServiceEnquiry,
    sendServiceEnquiry,
    withdrawEnquiry,

    responseForm,
    setResponseFormField,
    startProviderResponse,
    sendProviderResponse,

    circleSaveForm,
    setCircleSaveFormField,
    startCircleSave,
    saveServiceToCircle,
    removeServiceFromCircle,
    lastCircleSave,
    circleDirectory,

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
      sentEnquiries:
        myEnquiries.length,
      receivedEnquiries:
        receivedEnquiries.length,
      openReceivedEnquiries:
        receivedEnquiries.filter(
          (enquiry) =>
            ![
              "closed",
              "withdrawn",
            ].includes(
              enquiry.enquiry_status,
            ),
        ).length,
    },

    refresh: async () => {
      await Promise.all([
        loadApprovedListings(),
        loadPrivateDirectory(),
      ]);
    },
  };
}