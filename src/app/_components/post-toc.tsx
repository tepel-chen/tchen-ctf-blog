type Toc = {
  text: string;
  id: string;
  level: number;
  children: Toc[];
};

type Props = {
  toc: Toc[];
  title: string
};

export function PostToc({ toc, title }: Props) {
  const renderToc = (items: Toc[], depth = 0) => {
    return (
      <ul className={`pl-${depth * 4} space-y-2 ${depth !== 0 && 'list-disc' }`}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-sky-700 dark:text-sky-400 hover:underline hover:text-cyan-800 dark:hover:text-cyan-600 transition-colors"
            >
              {item.text}
            </a>
            {item.children && item.children.length > 0 && renderToc(item.children, depth + 1)}
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