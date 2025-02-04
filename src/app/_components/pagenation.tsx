"use client";

type Props = {
  currentPage: number;
  totalPages: number;
  pathAndQuery: string;
};

export function Pagenation({ currentPage, totalPages, pathAndQuery }: Props) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 w-fit mx-auto mb-32">
      <button
        onClick={() => {
          if (currentPage > 1) {
            window.location.assign(`/${pathAndQuery}${currentPage - 1}`);
          }
        }}
        disabled={currentPage === 1}
        className={`px-4 py-2 text-white font-semibold rounded-l-lg transition-all ${
          currentPage === 1
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-950 hover:bg-blue-800 dark:bg-cyan-700 dark:hover:bg-cyan-600"
        }`}
      >
        Previous
      </button>
      <span className="text-center">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => {
          if (currentPage < totalPages) {
            window.location.assign(`/${pathAndQuery}${currentPage + 1}`);
          }
        }}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 text-white font-semibold rounded-r-lg transition-all ${
          currentPage === totalPages
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-950 hover:bg-blue-800 dark:bg-cyan-700 dark:hover:bg-cyan-600"
        }`}
      >
        Next
      </button>
    </div>
  );
}
