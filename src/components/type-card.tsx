import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export interface TypeData {
  id: string;
  title: string;
  logo: string;
  gradient: string;
}

interface TypeCardProps {
  type: TypeData;
  onClick?: (typeId: string) => void;
}

export function TypeCard({ type, onClick }: TypeCardProps) {
  const isImageFile = type.logo.includes(".") || type.logo.startsWith("/");

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 overflow-hidden relative"
      onClick={() => onClick?.(type.id)}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
      />
      <CardContent className="p-4 relative z-10">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center justify-center">
            <div
              className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 overflow-hidden`}
            >
              {isImageFile ? (
                <Image
                  src={type.logo}
                  alt={type.title}
                  width={96}
                  height={96}
                  className="object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <span className="text-7xl filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {type.logo}
                </span>
              )}
            </div>
          </div>

          <h3 className="font-bold text-base text-center text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
            {type.title}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
}
