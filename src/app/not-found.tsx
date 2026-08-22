import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="text-4xl">Page not found</h1>
      <Link href="/" className="btn-clay mt-6">
        Back to Santh Digital
      </Link>
    </div>
  );
}
