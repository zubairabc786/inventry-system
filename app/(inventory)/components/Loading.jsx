export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen  overflow-hidden">
      <div className="ml-96 p-6 w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-red-400 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-red-400 h-32 rounded-2xl"></div>
            <div className="bg-red-400 h-32 rounded-2xl"></div>
            <div className="bg-red-400 h-32 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
