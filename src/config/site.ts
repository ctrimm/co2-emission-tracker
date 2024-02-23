import type { SiteConfig } from "@/types";
import ogImage from "/og-image.png";

export const siteConfig: SiteConfig = {
  name: "CO2 Web Emissions Tracker",
  description:
    "A simple app built to track carbon emissions over time of popular federal, state, & local government websites.",
  url: "https://ctrimm.github.io/co2-emission-tracker/",
  ogImage,
  links: {
    twitter: "https://twitter.com/cdt5058",
    github: "https://github.com/ctrimm/co2-emission-tracker",
  },
};
