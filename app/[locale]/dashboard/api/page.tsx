import { redirect } from "next/navigation";

export default function DashboardApiRedirect() {
  redirect("/api/dashboard");
}
