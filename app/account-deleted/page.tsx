import { Metadata } from "next";
import AccountDeletedClient from "./AccountDeletedClient";

export const metadata: Metadata = {
  title: "Account Deleted – FreeCustom.Email",
  description: "Your account has been permanently deleted.",
};

export default function AccountDeletedPage() {
  return <AccountDeletedClient />;
}
