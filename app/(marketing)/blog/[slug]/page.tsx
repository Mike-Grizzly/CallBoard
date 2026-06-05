import type { Metadata } from "next";
import "./blogpost.css";
import { BLOGPOST_HTML } from "./content";

export const metadata: Metadata = {
  title: "Set up your first production — ProScene",
  description:
    "A blank screen to your first call going out, step by step. We build a real show and have the whole company confirmed by the end.",
};

// Only one post exists today; it renders for any slug under /blog/.
export default function BlogPostPage() {
  return (
    <div data-page="blogpost" dangerouslySetInnerHTML={{ __html: BLOGPOST_HTML }} />
  );
}
