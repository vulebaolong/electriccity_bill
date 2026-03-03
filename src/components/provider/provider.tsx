"use client";
import "@mantine/core/styles.css";

import { ReactNode } from "react";
import MantineProvider from "./mantine/mantine.provider";

export default function Provider({ children }: { children: ReactNode }) {
    return <MantineProvider>{children}</MantineProvider>;
}
