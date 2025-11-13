import { COUPLE_TYPES, CoupleTypeCode } from "@/lib/constants/coupleTypes";
import { notFound } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

interface TypePageProps {
    params: Promise<{
        typeCode: string;
    }>;
}

export default async function TypePage({ params }: TypePageProps) {
    const { typeCode } = await params;

    // Fixes naming scheme
    const enumKey = typeCode.toUpperCase().replace(/-/g, '_') as CoupleTypeCode;
    const coupleType = COUPLE_TYPES[enumKey];

    // If type not found, show 404
    if (!coupleType) {
        notFound();
    }

    // Import Component for later
    const Component = dynamic(
        () => import(`@/components/types/${typeCode}`),
        {
            loading: () => <div className="text-center p-8">Loading...</div>,
            ssr: true
        }
    );

    return (
        <main className="min-h-screen bg-background snap-y snap-mandatory overflow-y-scroll h-screen">
            {/* You are... Section */}
            <section className="relative snap-start snap-always h-screen overflow-hidden">
                {/* All Images positioned relative to section for maximum flexibility */}

                {/* Faint PER background text */}
                <div className="absolute left-[12%] top-[2%] opacity-20 select-none pointer-events-none overflow-hidden z-5">
                    <p className="text-[5.04rem] sm:text-[7.56rem] md:text-[12.6rem] lg:text-[15.12rem] font-black text-pink-100 whitespace-nowrap tracking-wider font-[family-name:var(--font-family-press-start)]">PER</p>
                </div>

                {/* Scattered Hearts */}
                <Image src="/image.png" alt="" width={50} height={50} className="absolute top-[20%] left-[6%] opacity-60 rotate-8 w-30 h-30 md:w-30 md:h-30 z-10" />
                <Image src="/image.png" alt="" width={70} height={70} className="absolute top-[22%] right-[50%] opacity-65 rotate-350 w-14 h-14 md:w-18 md:h-18 z-10" />
                <Image src="/image.png" alt="" width={60} height={60} className="absolute top-[28%] right-[38%] opacity-70 -rotate-12 w-14 h-14 md:w-16 md:h-16 z-10" />

                {/* Big Heart Background - Right Side */}
                <Image src="/bigHeart.png" alt="" width={800} height={800} className="hidden md:block absolute top-[15%] right-[-5%] opacity-80 z-5 w-[600px] h-auto" />

                {/* Stick Figure Couple */}
                <Image
                    src="/stick_couple.png"
                    alt="Couple illustration"
                    width={1000}
                    height={800}
                    className="absolute right-[5%] top-[25%] hidden lg:block z-30 w-[700px] h-auto"
                />

                {/* Top Div - Pink Background with Content */}
                <div className="relative bg-pmpink2-500 min-h-[65vh] py-8 md:py-0 md:h-[65vh]">
                    <div className="container mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16 relative z-20">
                        {/* Main Content - Left Side */}
                        <div className="relative z-20">
                            <div className="max-w-2xl">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white mb-3 md:mb-4">You are ...</h2>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mt-4 md:mt-35 ml-4 md:ml-10 leading-tight">{coupleType.displayName}</h1>

                                {/* Stats and Button */}
                                <div className="flex flex-col items-start gap-3 md:gap-4 mt-6 md:mt-8">
                                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground font-medium flex flex-wrap items-center gap-2">
                                        <span className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-primary">46%</span>
                                        <span>of couples share your type</span>
                                    </p>
                                    <Button className="inline-flex items-center">
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
                                        Share Your Results!
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wavy Divider - Handles entire transition */}
                <div className="relative w-full overflow-hidden" style={{ transformOrigin: 'center', height: '140px', marginTop: '-70px', marginBottom: '-70px', zIndex: 20 }}>
                    <svg className="block w-full h-full"
                        viewBox="0 0 1200 240"
                        preserveAspectRatio="none">
                        <path
                            d="M0,90 C150,0 250,180 400,90 C550,0 650,180 800,90 C950,0 1050,180 1200,90 L1200,150 C1050,240 950,60 800,150 C650,240 550,60 400,150 C250,240 150,60 0,150 Z"
                            fill="rgb(223, 48, 47)"
                        ></path>
                    </svg>
                </div>
                {/* Bottom Section - Light Pink Background */}
                <div className="h-[35vh]" style={{ backgroundColor: 'rgb(251, 233, 233)' }}>
                </div>
            </section>

            {/* New Section - Scrollable Content */}
            <section className="relative snap-start snap-always min-h-screen bg-background pt-20">
                <div className="container mx-auto px-4 sm:px-6 md:px-12 py-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Your Type Details</h2>
                    <div className="space-y-6">
                        <p className="text-lg text-foreground/80">
                            This is your new section. Add content here about the couple type details, compatibility, or other information.
                        </p>
                        {/* Add your content here */}
                    </div>
                </div>
            </section>

        </main>
    );
}

export async function generateStaticParams() {
    return Object.values(COUPLE_TYPES).map((type) => ({
        typeCode: type.code.toLowerCase().replace(/_/g, '-'),
    }));
}