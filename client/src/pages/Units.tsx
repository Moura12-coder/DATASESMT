import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Units() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/app/settings"); }, []);
  return null;
}
