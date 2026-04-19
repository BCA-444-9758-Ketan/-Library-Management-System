import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
}

export const BookCover = ({ src, alt, className }: Props) => {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <div className={cn("flex h-full w-full items-center justify-center gradient-soft", className)}>
      <BookOpen className="h-10 w-10 text-primary/40" />
    </div>
  );
};
