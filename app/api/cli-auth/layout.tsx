import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLI Authentication – Auth flow testing API",
  description: "Authenticate your FreeCustom.Email CLI via OAuth.",
};

export default function CliAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
