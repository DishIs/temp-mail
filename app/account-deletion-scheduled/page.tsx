import { Metadata } from "next";
import AccountDeletionScheduledClient from "./AccountDeletionScheduledClient";

export const metadata: Metadata = {
  title: "Account Deletion Scheduled – FreeCustom.Email",
  description: "Your account is scheduled for deletion. You can restore it before the deletion date.",
};

export default function AccountDeletionScheduledPage() {
  return <AccountDeletionScheduledClient />;
}
