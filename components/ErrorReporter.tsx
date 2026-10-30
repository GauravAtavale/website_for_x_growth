"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/errors/report";

/** Listens for uncaught browser errors and reports them (see lib/errors/report.ts). */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => reportClientError(event.error ?? event.message, "error");
    const onRejection = (event: PromiseRejectionEvent) => reportClientError(event.reason, "unhandledrejection");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
