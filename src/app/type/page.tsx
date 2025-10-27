import { COUPLE_TYPES } from "@/lib/constants/coupleTypes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function CoupleTypesPage() {
  const coupleTypes = Object.values(COUPLE_TYPES);

  return (
    <main className="min-h-screen">
      {/* Row 1 - Types 1-4 */}
      <section className="min-h-[75vh] bg-background">
        <div className="container mx-auto px-12 py-16">
          <div className="grid lg:grid-cols-4 gap-8 items-start h-full">
            {coupleTypes.slice(0, 4).map((type, index) => (
              <div key={type.code} className="space-y-6 text-center flex flex-col items-center">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center p-8 w-full">
                    <Image 
                      src={type.graphic.iconUrl} 
                      alt={type.displayName}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">{type.displayName}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {type.shortDescription}
                  </p>
                  <Link href={`/type/${type.code.toLowerCase().replace(/_/g, '-')}`}>
                    <Button variant="outline" size="sm" className="mt-4">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Row 2 - Types 5-8 */}
      <section className="min-h-[75vh] bg-muted/30">
        <div className="container mx-auto px-12 py-16">
          <div className="grid lg:grid-cols-4 gap-8 items-start h-full">
            {coupleTypes.slice(4, 8).map((type, index) => (
              <div key={type.code} className="space-y-6 text-center flex flex-col items-center">
                <div className="aspect-square bg-gradient-to-br from-secondary/10 to-accent/10 rounded-2xl flex items-center justify-center p-8 w-full">
                    <Image 
                      src={type.graphic.iconUrl} 
                      alt={type.displayName}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">{type.displayName}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {type.shortDescription}
                  </p>
                  <Link href={`/type/${type.code.toLowerCase().replace(/_/g, '-')}`}>
                    <Button variant="outline" size="sm" className="mt-4">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Row 3 - Types 9-12 */}
      <section className="min-h-[75vh] bg-background">
        <div className="container mx-auto px-12 py-16">
          <div className="grid lg:grid-cols-4 gap-8 items-start h-full">
            {coupleTypes.slice(8, 12).map((type, index) => (
              <div key={type.code} className="space-y-6 text-center flex flex-col items-center">
                <div className="aspect-square bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl flex items-center justify-center p-8 w-full">
                    <Image 
                      src={type.graphic.iconUrl} 
                      alt={type.displayName}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">{type.displayName}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {type.shortDescription}
                  </p>
                  <Link href={`/type/${type.code.toLowerCase().replace(/_/g, '-')}`}>
                    <Button variant="outline" size="sm" className="mt-4">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Row 4 - Types 13-16 */}
      <section className="min-h-[75vh] bg-muted/20">
        <div className="container mx-auto px-12 py-16">
          <div className="grid lg:grid-cols-4 gap-8 items-start h-full">
            {coupleTypes.slice(12, 16).map((type, index) => (
              <div key={type.code} className="space-y-6 text-center flex flex-col items-center">
                <div className="aspect-square bg-gradient-to-br from-primary/15 to-secondary/15 rounded-2xl flex items-center justify-center p-8 w-full">
                    <Image 
                      src={type.graphic.iconUrl} 
                      alt={type.displayName}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">{type.displayName}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {type.shortDescription}
                  </p>
                  <Link href={`/type/${type.code.toLowerCase().replace(/_/g, '-')}`}>
                    <Button variant="outline" size="sm" className="mt-4">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}