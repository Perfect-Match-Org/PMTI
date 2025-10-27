import { COUPLE_TYPES, CoupleTypeCode } from "@/lib/constants/coupleTypes";
import { notFound } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

interface TypePageProps {
  params: Promise<{
    typeCode: string;
  }>;
}

export default async function TypePage({ params }: TypePageProps) {
  // Await params in Next.js 15+
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
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-12 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section probs should just render evevrything in component in final draft but im lazy for this*/}
          <div className="text-center mb-12">
            <div 
              className="aspect-square w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: `linear-gradient(135deg, ${coupleType.graphic.colorScheme.primary}20, ${coupleType.graphic.colorScheme.secondary}20)`
              }}
            >
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: `${coupleType.graphic.colorScheme.primary}30`
                }}
              >
                <Image 
                  src={coupleType.graphic.iconUrl} 
                  alt={coupleType.displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">{coupleType.displayName}</h1>
            <p className="text-xl text-muted-foreground">{coupleType.shortDescription}</p>
          </div>

          {/* Content Section - Render the actual component */}
          <div className="space-y-8">
            <Component />
          </div>
        </div>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  return Object.values(COUPLE_TYPES).map((type) => ({
    typeCode: type.code.toLowerCase().replace(/_/g, '-'),
  }));
}
