import { Loader as LucideLoader } from "lucide-react";

export default function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <LucideLoader size={32} className="animate-spin text-[#2A0066] mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    </div>
  );
}
