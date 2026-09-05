import Link from "next/link";

export function SelectBranchNote() {
  return (
    <div className="panel mt-6 p-5">
      <p className="font-medium">Choose a branch</p>
      <p className="mt-2 text-sm text-ink-soft">
        Timings, treatments and doctors are stored per branch. Pick one from the branch menu, then come back here.
      </p>
      <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-teal">
        Back to dashboard
      </Link>
    </div>
  );
}
