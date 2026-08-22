import Link from "next/link";

export default function ClinicMissing() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <h1 className="text-4xl">This clinic isn’t on Santh Digital yet.</h1>
      <Link href="/" className="btn-clay mt-6">
        Back to platform
      </Link>
    </div>
  );
}
