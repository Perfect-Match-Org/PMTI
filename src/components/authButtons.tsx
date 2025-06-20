'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { LogIn, LogOut } from "lucide-react";

export function AuthButtons() {
    const { data: session } = useSession();

    return (
        <div className="flex items-center gap-4">
            {session ? (
                <Button onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            ) : (
                <Button onClick={() => signIn("google")}>
                    <svg className="w-4 h-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8S109.8 11.8 244 11.8c70.3 0 129.2 28.5 173.4 72.8l-65.7 64.2C331.3 129 292.2 111.8 244 111.8c-76.3 0-138.3 62-138.3 138.3s62 138.3 138.3 138.3c87.3 0 119.2-61.1 123.6-92.8H244v-79.3h236.4c2.5 12.8 3.6 26.1 3.6 40.2z"></path>
                    </svg>
                    Login with Google
                </Button>
            )}
        </div>
    );
}