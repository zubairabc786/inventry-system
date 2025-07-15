export default function DashboardCard({ title, value, icon }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-md flex items-center space-x-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}
