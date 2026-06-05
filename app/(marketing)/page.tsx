import type { Metadata } from "next";
import "./home.css";
import { HOME_HTML } from "./home-content";

export const metadata: Metadata = {
  title: "ProScene — The production hub for stage managers",
  description:
    "The paper call board, reinvented. ProScene keeps your whole production on the same page — calls, calendars, scripts, blocking, and reports.",
};

export default function HomePage() {
  return <div data-page="home" dangerouslySetInnerHTML={{ __html: HOME_HTML }} />;
}
