import { Suspense } from "react";
import { Calculator } from "@/components/Calculator";

export const dynamic = "force-dynamic";

export default function CalculatricePage() {
  return (
    <Suspense>
      <Calculator />
    </Suspense>
  );
}
