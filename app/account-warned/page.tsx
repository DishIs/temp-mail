import { Metadata } from "next";
import AccountWarnedClient from "./AccountWarnedClient";

export const metadata: Metadata = {
  title: "Account Warning – FreeCustom.Email",
  description: "Your account has received a warning due to unusual activity.",
};

export default function AccountWarnedPage() {
  return <AccountWarnedClient />;
}
