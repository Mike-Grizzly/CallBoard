"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schema";

// Embedded Studio config. Mounted at /studio by app/studio/[[...tool]]/page.tsx.
// Project ID + dataset are public (they ship in the client bundle).
export default defineConfig({
  name: "default",
  title: "Proscene",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dsciikio",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  basePath: "/studio",
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
