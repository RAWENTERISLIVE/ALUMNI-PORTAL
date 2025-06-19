// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect } from 'react';
const App: React.FC = () => {
const [activeTab, setActiveTab] = useState('groups');
const [searchQuery, setSearchQuery] = useState('');
const [isLoading, setIsLoading] = useState(true);
const [showNotification, setShowNotification] = useState(false);
const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 1500);
  return () => clearTimeout(timer);
}, []);

const handleJoinGroup = (groupName: string) => {
  if (joinedGroups.includes(groupName)) {
    setJoinedGroups(joinedGroups.filter(name => name !== groupName));
  } else {
    setJoinedGroups([...joinedGroups, groupName]);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  }
};
return (
<div className="min-h-screen bg-white relative">
{/* Loading Screen */}
{isLoading && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">Loading groups...</p>
    </div>
  </div>
)}

{/* Notification Toast */}
{showNotification && (
  <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
    <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <i className="fas fa-check-circle"></i>
        <span>Successfully joined the group!</span>
      </div>
    </div>
  </div>
)}

{/* Header */}
<header className="bg-white border-b border-gray-200 py-2 px-4 flex items-center justify-between">
<div className="flex items-center">
<img src="https://readdy.ai/api/search-image?query=simple%20minimalist%20orange%20logo%20design%20with%20abstract%20shape%2C%20clean%20professional%20corporate%20identity%20on%20white%20background%2C%20high%20quality%20vector%20graphic&width=40&height=40&seq=logo1&orientation=squarish" alt="Logo" className="h-8 w-8" />
</div>
<div className="flex items-center space-x-4">
<div className="relative">
<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
<i className="fas fa-search text-sm"></i>
</span>
<input
type="text"
placeholder="Search alumni, groups, or posts..."
className="pl-10 pr-4 py-2 w-80 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
/>
</div>
<div className="flex items-center space-x-4">
<div className="relative cursor-pointer">
<i className="fas fa-bell text-gray-600"></i>
<span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
</div>
<div className="cursor-pointer">
<i className="fas fa-comment-alt text-gray-600"></i>
</div>
<div className="cursor-pointer">
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=40&height=40&seq=avatar1&orientation=squarish" alt="Profile" className="h-8 w-8 rounded-full object-cover" />
</div>
</div>
</div>
</header>
<div className="flex">
{/* Sidebar */}
<div className="w-64 border-r border-gray-200 h-[calc(100vh-56px)] p-4 flex flex-col space-y-4">
<div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-all duration-300 transform hover:translate-x-1">
<i className="fas fa-home text-gray-600"></i>
<span className="text-gray-700">Home Feed</span>
</div>
<div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
<i className="fas fa-user text-gray-600"></i>
<span className="text-gray-700">Profile</span>
</div>
<div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 cursor-pointer">
<i className="fas fa-users text-orange-500"></i>
<span className="text-orange-500 font-medium">Groups</span>
</div>
<div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
<i className="fas fa-briefcase text-gray-600"></i>
<span className="text-gray-700">Jobs</span>
</div>
<div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
<i className="fas fa-user-graduate text-gray-600"></i>
<span className="text-gray-700">Mentorship</span>
</div>
</div>
{/* Main Content */}
<div className="flex-1 p-6 overflow-y-auto">
<div className="max-w-3xl mx-auto">
<h1 className="text-2xl font-bold mb-6">Groups</h1>
{/* Search and Filter */}
<div className="flex items-center justify-between mb-6">
<div className="relative w-64">
<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
<i className="fas fa-search text-sm"></i>
</span>
<input
type="text"
placeholder="Search groups..."
className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
/>
</div>
<div className="flex items-center space-x-4">
<button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 !rounded-button whitespace-nowrap cursor-pointer">
<i className="fas fa-filter"></i>
<span>Filter</span>
</button>
<button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 !rounded-button whitespace-nowrap cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg group">
<i className="fas fa-plus transform transition-transform duration-300 group-hover:rotate-90"></i>
<span>Create Group</span>
</button>
</div>
</div>
{/* Group Categories */}
<div className="flex items-center space-x-4 mb-6 overflow-x-auto py-2">
<button className="px-4 py-2 bg-orange-500 text-white rounded-full !rounded-button whitespace-nowrap cursor-pointer">
All Groups
</button>
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 !rounded-button whitespace-nowrap cursor-pointer">
My Groups
</button>
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 !rounded-button whitespace-nowrap cursor-pointer">
Professional
</button>
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 !rounded-button whitespace-nowrap cursor-pointer">
Social
</button>
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 !rounded-button whitespace-nowrap cursor-pointer">
Academic
</button>
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 !rounded-button whitespace-nowrap cursor-pointer">
Regional
</button>
</div>
{/* Groups Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
{/* Group 1 */}
<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
<div className="h-32 bg-blue-50 relative overflow-hidden">
<img
src="https://readdy.ai/api/search-image?query=professional%20technology%20networking%20event%20with%20people%20discussing%20tech%20innovations%20in%20modern%20conference%20room%2C%20blue%20tech%20themed%20background%20with%20digital%20elements%2C%20high%20quality%20corporate%20event%20photography&width=400&height=150&seq=tech1&orientation=landscape"
alt="Tech Alumni Network"
className="w-full h-full object-cover"
/>
<div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-sm">
<i className="fas fa-laptop text-blue-500 text-xl"></i>
</div>
</div>
<div className="p-4">
<div className="flex justify-between items-start mb-2">
<h3 className="text-lg font-bold">Tech Alumni Network</h3>
<span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">1,450 members</span>
</div>
<p className="text-gray-600 text-sm mb-4">Connect with fellow alumni working in tech. Share job opportunities, industry insights, and career advice.</p>
<div className="flex items-center justify-between">
<div className="flex -space-x-2">
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar2&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar3&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar4&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
</div>
<button 
  onClick={() => handleJoinGroup('Tech Alumni Network')}
  className={`px-4 py-2 rounded-lg !rounded-button whitespace-nowrap cursor-pointer transition-all duration-300 transform hover:scale-105 ${
    joinedGroups.includes('Tech Alumni Network')
    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    : 'bg-blue-500 text-white hover:bg-blue-600'
  }`}
>
  {joinedGroups.includes('Tech Alumni Network') ? 'Leave' : 'Join'}
</button>
</div>
</div>
</div>
{/* Group 2 */}
<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
<div className="h-32 bg-green-50 relative overflow-hidden">
<img
src="https://readdy.ai/api/search-image?query=sustainability%20initiative%20with%20people%20planting%20trees%20and%20discussing%20environmental%20projects%2C%20green%20nature%20background%20with%20eco-friendly%20elements%2C%20high%20quality%20environmental%20event%20photography&width=400&height=150&seq=sustain1&orientation=landscape"
alt="Sustainability Initiative"
className="w-full h-full object-cover"
/>
<div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-sm">
<i className="fas fa-leaf text-green-500 text-xl"></i>
</div>
</div>
<div className="p-4">
<div className="flex justify-between items-start mb-2">
<h3 className="text-lg font-bold">Sustainability Initiative</h3>
<span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">876 members</span>
</div>
<p className="text-gray-600 text-sm mb-4">Join alumni passionate about environmental sustainability. Collaborate on green projects and share resources.</p>
<div className="flex items-center justify-between">
<div className="flex -space-x-2">
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar5&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar6&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar7&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
</div>
<button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 !rounded-button whitespace-nowrap cursor-pointer">Join</button>
</div>
</div>
</div>
{/* Group 3 */}
<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
<div className="h-32 bg-purple-50 relative overflow-hidden">
<img
src="https://readdy.ai/api/search-image?query=mentorship%20program%20with%20diverse%20professionals%20in%20discussion%2C%20sharing%20knowledge%20in%20modern%20office%20environment%2C%20purple%20themed%20background%20with%20educational%20elements%2C%20high%20quality%20professional%20development%20photography&width=400&height=150&seq=mentor1&orientation=landscape"
alt="Mentorship Program"
className="w-full h-full object-cover"
/>
<div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-sm">
<i className="fas fa-user-graduate text-purple-500 text-xl"></i>
</div>
</div>
<div className="p-4">
<div className="flex justify-between items-start mb-2">
<h3 className="text-lg font-bold">Mentorship Program</h3>
<span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">1,053 members</span>
</div>
<p className="text-gray-600 text-sm mb-4">Connect mentors and mentees across different career stages. Share experiences and guidance for professional growth.</p>
<div className="flex items-center justify-between">
<div className="flex -space-x-2">
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar8&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar9&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar10&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
</div>
<button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 !rounded-button whitespace-nowrap cursor-pointer">Join</button>
</div>
</div>
</div>
{/* Group 4 */}
<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
<div className="h-32 bg-amber-50 relative overflow-hidden">
<img
src="https://readdy.ai/api/search-image?query=entrepreneurship%20club%20with%20diverse%20business%20professionals%20discussing%20startup%20ideas%20in%20creative%20coworking%20space%2C%20amber%20themed%20background%20with%20business%20elements%2C%20high%20quality%20entrepreneurial%20event%20photography&width=400&height=150&seq=entre1&orientation=landscape"
alt="Entrepreneurship Club"
className="w-full h-full object-cover"
/>
<div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-sm">
<i className="fas fa-lightbulb text-amber-500 text-xl"></i>
</div>
</div>
<div className="p-4">
<div className="flex justify-between items-start mb-2">
<h3 className="text-lg font-bold">Entrepreneurship Club</h3>
<span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">789 members</span>
</div>
<p className="text-gray-600 text-sm mb-4">For alumni interested in startups and business ventures. Network with fellow entrepreneurs and share resources.</p>
<div className="flex items-center justify-between">
<div className="flex -space-x-2">
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar11&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar12&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar13&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
</div>
<button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 !rounded-button whitespace-nowrap cursor-pointer">Join</button>
</div>
</div>
</div>
</div>
{/* Recommended Groups */}
<div className="mb-8">
<h2 className="text-xl font-bold mb-4">Recommended for You</h2>
<div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
<div className="h-32 bg-red-50 relative overflow-hidden">
<img
src="https://readdy.ai/api/search-image?query=alumni%20networking%20event%20with%20diverse%20professionals%20in%20elegant%20venue%2C%20people%20discussing%20and%20connecting%2C%20red%20themed%20background%20with%20professional%20elements%2C%20high%20quality%20networking%20event%20photography&width=800&height=150&seq=alumni1&orientation=landscape"
alt="Class of 2015 Alumni"
className="w-full h-full object-cover"
/>
<div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-sm">
<i className="fas fa-graduation-cap text-red-500 text-xl"></i>
</div>
</div>
<div className="p-4">
<div className="flex justify-between items-start mb-2">
<h3 className="text-lg font-bold">Class of 2015 Alumni</h3>
<span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">325 members</span>
</div>
<p className="text-gray-600 text-sm mb-4">Stay connected with your classmates from the graduating class of 2015. Share updates, plan reunions, and network.</p>
<div className="flex items-center justify-between">
<div className="flex -space-x-2">
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar14&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar15&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<img src="https://readdy.ai/api/search-image?query=professional%20headshot%20of%20person%20with%20neutral%20expression%2C%20high%20quality%20portrait%20photo%20with%20clean%20background%2C%20business%20profile%20picture&width=32&height=32&seq=avatar16&orientation=squarish" alt="Member" className="w-8 h-8 rounded-full border-2 border-white" />
<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white text-xs text-gray-600">+42</div>
</div>
<button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 !rounded-button whitespace-nowrap cursor-pointer">Join</button>
</div>
</div>
</div>
</div>
{/* Recently Active Groups */}
<div>
<h2 className="text-xl font-bold mb-4">Recently Active</h2>
<div className="space-y-4">
{/* Active Group 1 */}
<div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
<div className="flex items-center space-x-4">
<div className="bg-teal-100 p-3 rounded-lg">
<i className="fas fa-globe text-teal-500 text-xl"></i>
</div>
<div>
<h3 className="font-medium">International Alumni Network</h3>
<p className="text-gray-500 text-sm">New post: "Virtual Global Meetup - June 30th"</p>
</div>
</div>
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 !rounded-button whitespace-nowrap cursor-pointer">View</button>
</div>
{/* Active Group 2 */}
<div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
<div className="flex items-center space-x-4">
<div className="bg-indigo-100 p-3 rounded-lg">
<i className="fas fa-palette text-indigo-500 text-xl"></i>
</div>
<div>
<h3 className="font-medium">Creative Arts Alumni</h3>
<p className="text-gray-500 text-sm">New event: "Summer Exhibition Opening"</p>
</div>
</div>
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 !rounded-button whitespace-nowrap cursor-pointer">View</button>
</div>
</div>
</div>
</div>
</div>
{/* Right Sidebar */}
<div className="w-80 border-l border-gray-200 p-4 h-[calc(100vh-56px)] overflow-y-auto">
<div className="mb-8">
<h2 className="text-lg font-bold mb-4">Your Groups</h2>
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center space-x-3">
<div className="bg-blue-100 p-2 rounded-lg">
<i className="fas fa-laptop text-blue-500"></i>
</div>
<span className="text-sm">Tech Alumni Network</span>
</div>
<span className="text-xs text-gray-500">3 new posts</span>
</div>
<div className="flex items-center justify-between">
<div className="flex items-center space-x-3">
<div className="bg-purple-100 p-2 rounded-lg">
<i className="fas fa-user-graduate text-purple-500"></i>
</div>
<span className="text-sm">Mentorship Program</span>
</div>
<span className="text-xs text-gray-500">1 new post</span>
</div>
<div className="flex items-center justify-between">
<div className="flex items-center space-x-3">
<div className="bg-red-100 p-2 rounded-lg">
<i className="fas fa-graduation-cap text-red-500"></i>
</div>
<span className="text-sm">Class of 2010</span>
</div>
<span className="text-xs text-gray-500">5 new posts</span>
</div>
</div>
<button className="mt-3 text-sm text-orange-500 hover:text-orange-600 cursor-pointer">
View all your groups
</button>
</div>
<div className="mb-8">
<h2 className="text-lg font-bold mb-4">Upcoming Group Events</h2>
<div className="space-y-4">
<div className="bg-white border border-gray-200 rounded-lg p-3">
<div className="flex items-center space-x-2 mb-2">
<div className="bg-blue-100 p-1.5 rounded">
<i className="fas fa-laptop text-blue-500 text-sm"></i>
</div>
<span className="text-sm font-medium">Tech Alumni Network</span>
</div>
<h3 className="font-medium mb-1">Tech Industry Panel Discussion</h3>
<p className="text-xs text-gray-500 mb-2">June 25, 2025 • 6:00 PM - 8:00 PM</p>
<div className="flex space-x-2">
<button className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded !rounded-button whitespace-nowrap cursor-pointer">RSVP</button>
<button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded !rounded-button whitespace-nowrap cursor-pointer">Details</button>
</div>
</div>
<div className="bg-white border border-gray-200 rounded-lg p-3">
<div className="flex items-center space-x-2 mb-2">
<div className="bg-green-100 p-1.5 rounded">
<i className="fas fa-leaf text-green-500 text-sm"></i>
</div>
<span className="text-sm font-medium">Sustainability Initiative</span>
</div>
<h3 className="font-medium mb-1">Campus Clean-up Day</h3>
<p className="text-xs text-gray-500 mb-2">June 30, 2025 • 10:00 AM - 2:00 PM</p>
<div className="flex space-x-2">
<button className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded !rounded-button whitespace-nowrap cursor-pointer">RSVP</button>
<button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded !rounded-button whitespace-nowrap cursor-pointer">Details</button>
</div>
</div>
</div>
</div>
<div>
<h2 className="text-lg font-bold mb-4">Group Suggestions</h2>
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center space-x-3">
<div className="bg-amber-100 p-2 rounded-lg">
<i className="fas fa-lightbulb text-amber-500"></i>
</div>
<div>
<div className="text-sm font-medium">Entrepreneurship Club</div>
<div className="text-xs text-gray-500">789 members</div>
</div>
</div>
<button className="px-3 py-1.5 border border-orange-500 text-orange-500 text-xs rounded hover:bg-orange-50 !rounded-button whitespace-nowrap cursor-pointer">Join</button>
</div>
<div className="flex items-center justify-between">
<div className="flex items-center space-x-3">
<div className="bg-indigo-100 p-2 rounded-lg">
<i className="fas fa-palette text-indigo-500"></i>
</div>
<div>
<div className="text-sm font-medium">Creative Arts Alumni</div>
<div className="text-xs text-gray-500">542 members</div>
</div>
</div>
<button className="px-3 py-1.5 border border-orange-500 text-orange-500 text-xs rounded hover:bg-orange-50 !rounded-button whitespace-nowrap cursor-pointer">Join</button>
</div>
<div className="flex items-center justify-between">
<div className="flex items-center space-x-3">
<div className="bg-teal-100 p-2 rounded-lg">
<i className="fas fa-globe text-teal-500"></i>
</div>
<div>
<div className="text-sm font-medium">International Alumni</div>
<div className="text-xs text-gray-500">1,245 members</div>
</div>
</div>
<button className="px-3 py-1.5 border border-orange-500 text-orange-500 text-xs rounded hover:bg-orange-50 !rounded-button whitespace-nowrap cursor-pointer">Join</button>
</div>
</div>
</div>
</div>
</div>
</div>
);
};
export default App