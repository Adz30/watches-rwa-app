import Link from 'next/link';

export default function QuickActionCard({ title, description, href, icon: Icon, color, onClick }) {
  const CardContent = () => (
    <div className="flex items-start space-x-4">
      <div className={`p-3 rounded-lg ${color} transition-colors`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 group"
      >
        <CardContent />
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 group"
    >
      <CardContent />
    </Link>
  );
}