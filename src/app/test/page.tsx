'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Tailwind CSS Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">Card 1</h2>
            <p className="text-gray-600">This is a test card with Tailwind CSS styling.</p>
            <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
              Button
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-green-600 mb-4">Card 2</h2>
            <p className="text-gray-600">Another test card to verify styling works.</p>
            <button className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors">
              Button
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-purple-600 mb-4">Card 3</h2>
            <p className="text-gray-600">Third test card with purple accent.</p>
            <button className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors">
              Button
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Styling Test</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Red indicator</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700">Yellow indicator</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Green indicator</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/dashboard" 
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}