import Image from "next/image";
import Link from "next/link";

// TODO: Redirect user properly between login.

export default function Header() {
    // TODO: Fade in images / page transition
    return (
        <div
            className={`w-full h-12 px-4 flex justify-between items-center border-b border-b-muted shadow`}>
            <div className={`w-40 h-full relative flex items-center`}>
                <Image
                    src="/ENGAGE-Primary_Logo.png"
                    alt="Engage Logo"
                    fill
                    style={{ objectFit: "contain" }}
                />
            </div>
            {/* TODO: Swap sign in to sign out when signed in. */}
            <Link href="/auth/login/">
                <p className="uppercase">Sign In</p>
            </Link>
        </div>
    );
}
