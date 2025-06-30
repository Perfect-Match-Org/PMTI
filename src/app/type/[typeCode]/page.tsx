import { COUPLE_TYPES } from "@/lib/constants/coupleTypes";
import { notFound } from "next/navigation";

interface TypePageProps {
  params: {
    typeCode: string;
  };
}

export default function TypePage({ params }: TypePageProps) {
  // Convert URL param back to type code format (e.g., "the-advocates" -> "THE_ADVOCATES")
  const typeCode = params.typeCode.toUpperCase().replace(/-/g, '_');
  
  // Find the matching type
  const coupleType = Object.values(COUPLE_TYPES).find(type => type.code === typeCode);
  
  // If type not found, show 404
  if (!coupleType) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-12 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="aspect-square w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-5xl">💕</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">{coupleType.displayName}</h1>
            <p className="text-xl text-muted-foreground">{coupleType.shortDescription}</p>
          </div>

          {/* Content Section - This is where you'll import your component later */}
          <div className="space-y-8">
            {/* Placeholder for your future component */}
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                Component for {coupleType.displayName} will be imported here
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Type Code: {coupleType.code}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Generate static params for all couple types (optional, for better performance)
export async function generateStaticParams() {
  return Object.values(COUPLE_TYPES).map((type) => ({
    typeCode: type.code.toLowerCase().replace(/_/g, '-'),
  }));
}
