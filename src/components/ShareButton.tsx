'use client';

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
    buttonText?: string;
    showShareMenu?: boolean;
}

export function ShareButton({ buttonText = "Share Your Results!", showShareMenu = true }: ShareButtonProps) {
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

    return (
        <div className="relative flex items-center">
            <Button
                variant="pressed"
                size="lg"
                className="mt-2 ml-4 z-[60]"
                onClick={() => showShareMenu && setIsShareMenuOpen(!isShareMenuOpen)}
            >
                <svg
                    className="mr-2 -ml-1 w-4 h-4"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="share"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                >
                    <path
                        fill="currentColor"
                        d="M307 34.8c-11.5 5.1-19 16.6-19 29.2v64H176C78.8 128 0 206.8 0 304C0 417.3 81.5 467.9 100.2 478.1c2.5 1.4 5.3 1.9 8.1 1.9c10.9 0 19.7-8.9 19.7-19.7c0-7.5-4.3-14.4-9.8-19.5C108.8 431.9 96 414.4 96 384c0-53 43-96 96-96h96v64c0 12.6 7.4 24.1 19 29.2s25 3 34.4-5.4l160-144c6.7-6.1 10.6-14.7 10.6-23.8s-3.8-17.7-10.6-23.8l-160-144c-9.4-8.5-22.9-10.6-34.4-5.4z"
                    ></path>
                </svg>
                {buttonText}
            </Button>

            {/* Social Media Share Menu */}
            {showShareMenu && (
                <div
                    className={`absolute left-full -ml-4 flex items-center justify-around gap-2 px-6 py-2 rounded-full backdrop-blur-md backdrop-saturate-135 transition-all duration-300 ease-in-out z-50 min-w-[280px] ${isShareMenuOpen
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-4 pointer-events-none'
                        }`}
                    style={{ transform: 'translateY(8px)' }}
                >
                <button className="hover:scale-110 transition-transform flex-shrink-0">
                    <Image src="/facebookIcon.png" alt="Share on Facebook" width={32} height={32} className="w-6 h-6" />
                </button>
                <button className="hover:scale-110 transition-transform flex-shrink-0">
                    <Image src="/twitterIcon.png" alt="Share on Twitter" width={32} height={32} className="w-6 h-6" />
                </button>
                <button className="hover:scale-110 transition-transform flex-shrink-0">
                    <Image src="/instagramIcon.png" alt="Share on Instagram" width={32} height={32} className="w-6 h-6" />
                </button>
                <button className="hover:scale-110 transition-transform flex-shrink-0">
                    <Image src="/tikTokIcon.png" alt="Share on TikTok" width={32} height={32} className="w-6 h-6" />
                </button>
                <button className="hover:scale-110 transition-transform flex-shrink-0">
                    <Image src="/wechatIcon.png" alt="Share on WeChat" width={32} height={32} className="w-6 h-6" />
                </button>
                <button className="hover:scale-110 transition-transform flex-shrink-0">
                    <Image src="/downloadIcon.png" alt="Download" width={32} height={32} className="w-6 h-6" />
                </button>
            </div>
            )}
        </div>
    );
}
