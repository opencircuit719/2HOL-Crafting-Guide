"use client";

import ObjectSearch from "@/components/search/ObjectSearch";
import { ObjectIndexEntry } from "@/lib/types";
import { usePathname } from "next/navigation";

interface HeaderSearchProps {
  objects: ObjectIndexEntry[];
}

export default function HeaderSearch({ objects }: HeaderSearchProps) {
  const pathname = usePathname();
  if (pathname === "/") {
    return <div className="flex-1" />;
  }
  return (
    <div className="flex-1 flex justify-center">
      <ObjectSearch objects={objects} compact />
    </div>
  );
}
