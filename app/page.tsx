"use client";

import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

import { useState, useEffect } from "react";




const subtitles = [
    "Where students bring their project ideas to life — together.",
    "Share ideas. Collaborate freely. Build something great.",
    "A collaborative hub for student innovation, feedback, and initiative.",
    "Got an idea? Toss it in. Someone might just build it!",
    "Empowering students to create, connect, and contribute — one idea at a time."
];


export default function Home() {
  const [subtitleText, setSubtitleText] = useState(subtitles[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * subtitles.length);
    setSubtitleText(subtitles[randomIndex]);
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Student&nbsp;</span>
        <span className={title({ color: "cyan" })}>Project Idea Portal&nbsp;</span>
        <br />
        <div className={subtitle({ class: "mt-4" })}>
          {subtitleText}
        </div>
      </div>

      <div className="flex gap-3">
        {/* <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={siteConfig.links.docs}
        >
          Documentation
        </Link> */}
        {/* <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          GitHub
        </Link> */}
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="bordered">
          <span>
            Get started by editing <Code color="primary">app/page.tsx</Code>
          </span>
        </Snippet>
      </div>
    </section>
  );
}
