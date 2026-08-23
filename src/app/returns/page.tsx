import type { Metadata } from "next";
import { ReturnsClient } from "./returns-client";

export const metadata: Metadata = {
  title: "Returns & Refunds | MEME Atelier",
  description:
    "Submit a return or refund request for your MEME Atelier order. Returns accepted within 14 days of purchase.",
};

export default function ReturnsPage() {
  return <ReturnsClient />;
}
