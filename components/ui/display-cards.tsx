"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface DisplayCardProps {
  className?: string;
  icon?: ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
  onClick?: () => void;
}

export function DisplayCard({
  className,
  icon,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-blue-500",
  titleClassName = "text-blue-500",
  onClick,
}: DisplayCardProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 border-white/10 bg-[#1F2023]/80 px-4 py-3 backdrop-blur-sm transition-all duration-700",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-linear-to-l after:from-[#07080c] after:to-transparent after:content-['']",
        "hover:border-white/20 hover:bg-[#25262b]/90 [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        onClick && "cursor-pointer text-left",
        className,
      )}
    >
      <div>
        <span className={cn("relative inline-block rounded-full bg-blue-800 p-1", iconClassName)}>
          {icon}
        </span>
        <p className={cn("text-lg font-medium text-gray-100", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg text-gray-100">{description}</p>
      <p className="text-gray-400">{date}</p>
    </Tag>
  );
}

export interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards: DisplayCardProps[] = [
    {
      className:
        "[grid-area:stack] grayscale-100 hover:-translate-y-10 hover:grayscale-0 before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-xl before:bg-[#07080c]/50 before:content-[''] before:transition-opacity before:duration-700 hover:before:opacity-0",
    },
    {
      className:
        "[grid-area:stack] translate-x-16 translate-y-10 grayscale-100 hover:-translate-y-1 hover:grayscale-0 before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-xl before:bg-[#07080c]/50 before:content-[''] before:transition-opacity before:duration-700 hover:before:opacity-0",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards ?? defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
