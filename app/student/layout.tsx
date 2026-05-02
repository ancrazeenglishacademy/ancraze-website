"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Loader from "../componets/Loder";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const userDataCookie = Cookies.get("userData");
        let userData: { role?: string; isBlocked?: boolean } = {};

        if (userDataCookie) {
            try {
                userData = JSON.parse(userDataCookie);
            } catch {
                router.replace("/login");
                return;
            }
        }

        // Check if blocked
        if (userData.isBlocked === true) {
            router.replace("/blocked");
            return;
        }

        const role = userData.role || Cookies.get("role");
        if (role === "student") {
            setAuthorized(true);
        } else {
            router.replace("/login");
        }
    }, [router]);

    if (!authorized) return <Loader />;

    return (
        <div className="min-h-screen bg-slate-50">
            {children}
        </div>
    );
}
