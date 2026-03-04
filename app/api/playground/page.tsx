import { PlaygroundClient } from "./PlaygroundClient";

export const metadata = {
  title: "API Playground – FreeCustom.Email",
  description: "Try the API live with the interactive explorer.",
};

export default function PlaygroundPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <PlaygroundClient />
    </div>
  );
}
