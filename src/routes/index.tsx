import { createFileRoute } from "@tanstack/react-router";
import { PaleHallApp } from "@/components/game/PaleHallApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PaleHallApp />;
}
