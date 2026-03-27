import { Metadata } from "next";
import AccountBannedClient from "./AccountBannedClient";

export const metadata: Metadata = {
  title: "Account Banned – FreeCustom.Email",
  description: "Your account has been banned due to policy violation or suspicious activity.",
};

export default function AccountBannedPage() {
  return <AccountBannedClient />;
}
