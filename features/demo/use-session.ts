"use client";
import { useSyncExternalStore } from "react";
import { demoSession, getServerSession } from "./session";
export function useDemoSession() { return useSyncExternalStore(demoSession.subscribe, demoSession.getSnapshot, getServerSession); }
