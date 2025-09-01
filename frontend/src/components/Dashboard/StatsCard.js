export default function StatsCard({ title, value, icon: Icon, color, bgColor, trend, trendValue }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center mt-1">
              <span className={`text-xs font-medium ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}