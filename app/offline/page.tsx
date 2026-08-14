import { WifiSlash, House } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-yellow-50">
      <div className="p-4 bg-rose-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full">
        <WifiSlash size={48} weight="bold" className="text-black" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-black">Anda Sedang Offline</h1>
      <p className="text-sm text-neutral-700 max-w-sm leading-relaxed">
        Beberapa fitur online mungkin tidak tersedia. Periksa koneksi internet Anda dan coba lagi.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-black bg-yellow-400 hover:bg-yellow-300 font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
      >
        <House size={16} weight="bold" />
        <span>Kembali ke Beranda</span>
      </Link>
    </main>
  );
}
