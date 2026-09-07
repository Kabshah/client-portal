"use client";

import { useState } from "react";
import { Button, buttonVariants } from "../ui/button";
import { clientApiFetch } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

const logoutButtonClass = cn(
  buttonVariants({ variant: "destructive", size: "sm" }),
  "h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3.5 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 border border-red-700/20 cursor-pointer"
);

function LogoutButton() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      setIsPending(true);

      await clientApiFetch<{ message: string }>("/auth/logout", {
        method: "POST",
      });

      router.push("/");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      className={logoutButtonClass}
      onClick={handleLogout}
      disabled={isPending}
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>{isPending ? "Logging out…" : "Logout"}</span>
    </Button>
  );
}

export default LogoutButton;
