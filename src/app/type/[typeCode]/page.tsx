import { COUPLE_TYPES, CoupleTypeCode } from "@/lib/constants/coupleTypes";
import { notFound } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ShareButton } from "@/components/ShareButton";

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

    return (
        <main className="min-h-screen bg-background snap-y snap-mandatory overflow-y-scroll h-screen">
            {/* You are... Section */}
            <section className="relative snap-start snap-always h-screen overflow-hidden">
                {/* All Images positioned relative to section for maximum flexibility */}

                {/* Faint RER background text */}
                <div className="absolute left-[12%] top-[15%] opacity-20 select-none pointer-events-none overflow-hidden z-5">
                    <p className="text-[3.326rem] sm:text-[4.990rem] md:text-[8.316rem] lg:text-[9.979rem] font-black text-pink-100 whitespace-nowrap tracking-wider" style={{ fontFamily: 'var(--font-press-start)' }}>RER</p>
                </div>

                {/* Scattered Hearts */}
                <Image src="/image.png" alt="" width={50} height={50} className="absolute top-[20%] left-[6%] opacity-60 rotate-8 w-30 h-30 md:w-30 md:h-30 z-10" />
                <Image src="/image.png" alt="" width={70} height={70} className="absolute top-[22%] right-[50%] opacity-65 rotate-89 w-14 h-14 md:w-18 md:h-18 z-10" />
                <Image src="/image.png" alt="" width={60} height={60} className="absolute top-[28%] right-[38%] opacity-70 -rotate-12 w-14 h-14 md:w-16 md:h-16 z-10" />

                {/* Big Heart Background - Right Side */}
                <Image src="/bigHeart.png" alt="" width={558} height={389} className="hidden md:block absolute top-[5%] right-[-2%] opacity-80 z-5 w-[450px] h-[313.5px]" />

                {/* Stick Figure Couple */}
                <Image
                    src="/stick_couple.png"
                    alt="Couple illustration"
                    width={1000}
                    height={800}
                    className="absolute right-[-5%] top-[0%] hidden lg:block z-30 w-[800px] h-auto"
                />

                {/* Top Div - Pink Background with Content */}
                <div className="relative bg-pmpink2-500 min-h-[65vh] py-8 md:py-0 md:h-[65vh]">
                    <div className="container mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16 relative z-20">
                        {/* Main Content - Left Side */}
                        <div className="relative z-20">
                            <div className="max-w-2xl flex flex-col-reverse">
                                {/* Stats and Button */}
                                <div className="flex flex-col items-start gap-3 md:gap-4 mt-6 md:mt-8">
                                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground font-medium flex flex-wrap items-center gap-2">
                                        <Image src="/share_icon.png" alt="" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10 mr-[-4px]" />
                                        <span className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-primary">46%</span>
                                        <span>of couples share your type</span>
                                    </p>
                                    <ShareButton />
                                </div>

                                {/* Title section - appears above due to flex-col-reverse */}
                                <div>
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white mb-3 md:mb-4">You are ...</h2>
                                    <h1 className="text-[1.278rem] sm:text-[1.916rem] md:text-[3.194rem] lg:text-[3.831rem] font-bold text-foreground mt-4 md:mt-35 ml-4 md:ml-10 leading-[0.88] break-words max-w-[26ch]">{coupleType.displayName}</h1>
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
                {/* Bottom Section*/}
                <div className="h-[35vh]" style={{ backgroundColor: 'rgb(251, 233, 233)' }}>
                </div>
            </section>

            {/* Section 2 */}
            <section className="relative snap-start snap-always min-h-screen bg-background pt-24 overflow-hidden">
                {/* Stick Figure Couple */}
                <Image
                    src="/stick_couple_mirrored.png"
                    alt="Couple illustration"
                    width={600}
                    height={460}
                    className="absolute left-[70%] bottom-[0%] hidden lg:block z-30 w-[400px] h-auto opacity-80"
                />
                <Image
                    src="/stick_couple_mirrored.png"
                    alt="Couple illustration"
                    width={600}
                    height={460}
                    className="absolute left-[4%] bottom-[77%] hidden lg:block z-0 w-[300px] h-auto opacity-80"
                />

                <div className="container mx-auto px-4 sm:px-6 md:px-12 py-6 max-w-7xl">
                    {/* Top Section: Description + Stick Figure + Personality Bars */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
                        {/* Left: Type Description Box */}
                        <div className="bg-pink-50 rounded-3xl p-5 relative" style={{ boxShadow: '4px 4px 0px rgb(241, 168, 176)' }}>
                            <h3 className="text-xl md:text-2xl font-bold text-primary mb-2.5 text-right">
                                {coupleType.displayName} - PER
                            </h3>
                            <p className="text-foreground/80 leading-relaxed text-sm">
                                {coupleType.description.summary}
                            </p>
                        </div>

                        {/* Right: Personality Bars */}
                        <div className="space-y-3.5">
                            {/* Planned vs Spontaneous */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-base font-semibold text-blue-900">Planned</span>
                                    <span className="text-base font-semibold text-pink-500">Spontaneous</span>
                                </div>
                                <div className="relative h-10 bg-pink-100 rounded-full overflow-hidden" style={{ boxShadow: '3px 3px 0px rgb(241, 168, 176)' }}>
                                    <div
                                        className="absolute left-0 top-0 h-full bg-blue-900 flex items-center justify-start px-3"
                                        style={{ width: `${coupleType.dimensions?.planned || 50}%` }}
                                    >
                                        <span className="text-white font-bold text-base">{coupleType.dimensions?.planned || 50}%</span>
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 h-full flex items-center justify-end px-3"
                                        style={{ width: `${100 - (coupleType.dimensions?.planned || 50)}%` }}
                                    >
                                        <span className="text-pink-500 font-bold text-base">{100 - (coupleType.dimensions?.planned || 50)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Physical vs Emotional */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-base font-semibold text-pink-500">Physical</span>
                                    <span className="text-base font-semibold text-blue-900">Emotional</span>
                                </div>
                                <div className="relative h-10 bg-blue-100 rounded-full overflow-hidden" style={{ boxShadow: '3px 3px 0px rgb(241, 168, 176)' }}>
                                    <div
                                        className="absolute left-0 top-0 h-full bg-pink-100 flex items-center justify-start px-3"
                                        style={{ width: `${coupleType.dimensions?.physical || 50}%` }}
                                    >
                                        <span className="text-pink-500 font-bold text-base">{coupleType.dimensions?.physical || 50}%</span>
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 h-full bg-blue-900 flex items-center justify-end px-3"
                                        style={{ width: `${100 - (coupleType.dimensions?.physical || 50)}%` }}
                                    >
                                        <span className="text-white font-bold text-base">{100 - (coupleType.dimensions?.physical || 50)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Reflective vs Active */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-base font-semibold text-blue-900">Reflective</span>
                                    <span className="text-base font-semibold text-pink-500">Active</span>
                                </div>
                                <div className="relative h-10 bg-pink-100 rounded-full overflow-hidden" style={{ boxShadow: '3px 3px 0px rgb(241, 168, 176)' }}>
                                    <div
                                        className="absolute left-0 top-0 h-full bg-blue-900 flex items-center justify-start px-3"
                                        style={{ width: `${coupleType.dimensions?.reflective || 50}%` }}
                                    >
                                        <span className="text-white font-bold text-base">{coupleType.dimensions?.reflective || 50}%</span>
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 h-full flex items-center justify-end px-3"
                                        style={{ width: `${100 - (coupleType.dimensions?.reflective || 50)}%` }}
                                    >
                                        <span className="text-pink-500 font-bold text-base">{100 - (coupleType.dimensions?.reflective || 50)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Row: Date Ideas and Conflict Resolution (Full Width) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        {/* Date Ideas */}
                        <div className="bg-pink-50 rounded-3xl p-4 relative" style={{ boxShadow: '4px 4px 0px rgb(241, 168, 176)' }}>
                            <div className="absolute -top-4 -right-4 w-14 h-14">
                                <Image src="/image.png" alt="" width={56} height={56} className="w-full h-full rotate-12" />
                            </div>
                            <h4 className="text-lg font-bold text-primary mb-2.5 flex items-center gap-2">
                                <span className="text-xl">💝</span> Date Ideas
                            </h4>
                            <ul className="space-y-1.5">
                                {coupleType.dateIdeas?.map((idea, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <span className="text-pink-500">○</span>
                                        <span className="text-foreground/80 text-sm">{idea}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* How They Resolve Conflict */}
                        <div className="bg-pink-50 rounded-3xl p-4" style={{ boxShadow: '4px 4px 0px rgb(241, 168, 176)' }}>
                            <h4 className="text-lg font-bold text-primary mb-2.5 flex items-center gap-2">
                                <span className="text-xl">❤️‍🩹</span> How They Resolve Conflict
                            </h4>
                            <p className="text-foreground/80 leading-relaxed text-sm">
                                {coupleType.conflictResolutionText || coupleType.description.conflictResolution?.style}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Row: Love Language (Full Width) */}
                    <div className="grid grid-cols-1 gap-5">
                        {/* Love Language */}
                        <div className="bg-pink-50 rounded-3xl p-4" style={{ boxShadow: '4px 4px 0px rgb(241, 168, 176)' }}>
                            <h4 className="text-lg font-bold text-primary mb-2.5 flex items-center gap-2">
                                <span className="text-xl">💖</span> Love Language
                            </h4>
                            <ul className="space-y-1.5">
                                {coupleType.loveLanguages?.map((language, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <span className="text-pink-500">○</span>
                                        <span className="text-foreground/80 text-sm">{language}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
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