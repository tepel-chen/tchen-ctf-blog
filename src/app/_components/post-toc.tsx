"use client";

import { useEffect, useState } from "react";

type Toc = {
  text: string;
  id: string;
  level: number;
  children: Toc[];
};

type Props = {
  toc: Toc[];
  title: string;
};

export function PostToc({ toc, title }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "0px -20% -80% 0px",
      threshold: 1.0,
    });

    const elements = document.querySelectorAll("h1, h2, h3, h4");
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);
  const renderToc = (items: Toc[], depth = 0) => {
    return (
      <ul className={`pl-${depth * 4} space-y-2 ${depth !== 0 && "list-disc"}`}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`text-sky-700 dark:text-sky-400 hover:underline hover:text-cyan-800 dark:hover:text-cyan-600 ${
                activeId === item.id
                  ? "font-bold text-cyan-800 dark:!text-cyan-200"
                  : ""
              } transition-colors`}
            >
              {item.text}
            </a>
            {item.children &&
              item.children.length > 0 &&
              renderToc(item.children, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="col-span-1 md:order-2 order-1">
      <nav className="sticky top-4 p-4 overflow-auto">
        <h2 className="text-xl font-bold mb-8">{title}</h2>
        {renderToc(toc)}
      </nav>
    </div>
  );
}
