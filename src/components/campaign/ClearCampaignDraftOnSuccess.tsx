"use client";

import { useEffect } from "react";
import { clearCampaignDraft } from "@/lib/campaign/draft";

/** Clears wizard draft only after a campaign is actually created / paid. */
export default function ClearCampaignDraftOnSuccess({
  active,
}: {
  active: boolean;
}) {
  useEffect(() => {
    if (active) clearCampaignDraft();
  }, [active]);

  return null;
}
