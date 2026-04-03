"use client";

import { useEffect, useState, ReactNode } from "react";
import { CreditsSuccessModal } from "@/components/credits-success-modal";

interface DashboardWrapperProps {
  children: ReactNode;
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  const [showCreditsSuccess, setShowCreditsSuccess] = useState(false);
  const [checkedUpgrade, setCheckedUpgrade] = useState(false);

  useEffect(() => {
    if (checkedUpgrade) return;
    setCheckedUpgrade(true);

    const justUpgraded = sessionStorage.getItem("just_upgraded");
    if (justUpgraded === "true") {
      sessionStorage.removeItem("just_upgraded");
      setShowCreditsSuccess(true);
    }
  }, [checkedUpgrade]);

  return (
    <>
      {children}
      <CreditsSuccessModal 
        isOpen={showCreditsSuccess} 
        onClose={() => setShowCreditsSuccess(false)} 
      />
    </>
  );
}
