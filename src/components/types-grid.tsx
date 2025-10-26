"use client";

import { TypeCard } from "./type-card";
import { RELATIONSHIP_TYPES } from "@/data/relationTypes";
import { Button } from "@ui/button";

interface TypesGridProps {
  onTypeClick?: (typeId: string) => void;
}

export function TypesGrid({ onTypeClick }: TypesGridProps) {
  const handleTypeClick = (typeId: string) => {
    console.log(`Selected type: ${typeId}`);
    onTypeClick?.(typeId);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold pb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Discover Your Couple Type
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the different relationship dynamics and find which one resonates with your
            partnership
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {RELATIONSHIP_TYPES.map((type) => (
            <TypeCard key={type.id} type={type} onClick={handleTypeClick} />
          ))}
        </div>

        <div className="text-center mt-12 p-8 bg-card rounded-lg border shadow-sm">
          <p className="text-lg font-medium text-foreground">
            Take our compatibility quiz to discover which type matches your relationship!
          </p>
          <Button size="lg" className="font-semibold m-4">
            Start Quiz Now
          </Button>
          <div className="text-sm text-muted-foreground">
            &copy; 2025 Cornell University Perfect Match
          </div>
        </div>
      </div>
    </section>
  );
}
