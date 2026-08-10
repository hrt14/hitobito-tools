"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { trackLife1Event, type Life1EventParams } from "@/lib/life1-analytics";

type Props = Omit<ComponentProps<typeof Link>, "onClick"> & {
  eventName: string;
  eventParams?: Life1EventParams;
  children: ReactNode;
};

export default function TrackedLink({ eventName, eventParams = {}, children, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={() => trackLife1Event(eventName, eventParams)}
    >
      {children}
    </Link>
  );
}
