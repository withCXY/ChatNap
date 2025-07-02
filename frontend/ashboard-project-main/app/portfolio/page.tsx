'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface PortfolioItem {
  id: string;
  imageUrl: string | null;
  imageFile: File | null;
  tags: string;
  description: string;
  price: string;
  isEditing: boolean;
  isUploading?: boolean;
}

export default function PortfolioPage() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [merchantEmail, setMerchantEmail] = useState<string>('test@example.com'); // 这里应该从用户登录状态获取

  // Load existing portfolio items on component mount
  useEffect(() => {
    const loadPortfolioItems = async () => {
      try {
        const response = await fetch(`/api/portfolio?merchant_email=${encodeURIComponent(merchantEmail)}`);
        if (response.ok) {
          const data = await response.json();
          const items = data.map((item: any) => ({
            id: item.id,
            imageUrl: item.image_url,
            imageFile: null,
            tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
            description: item.description || '',
            price: item.price ? item.price.toString() : '',
            isEditing: false,
          }));
          setPortfolioItems(items);
        }
      } catch (error) {
        console.error('Error loading portfolio items:', error);
      }
    };

    if (merchantEmail) {
      loadPortfolioItems();
    }
  }, [merchantEmail]);

  const handleImageUpload = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);

      setPortfolioItems(prev =>
        prev.map(item => (item.id === id ? { ...item, imageFile: file, imageUrl: url } : item))
      );
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);

      setPortfolioItems(prev =>
        prev.map(item => (item.id === id ? { ...item, imageFile: file, imageUrl: url } : item))
      );
    }
  }, []);

  const handleFieldChange = useCallback((id: string, field: 'tags' | 'description' | 'price', value: string) => {
    setPortfolioItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  }, []);

  const handleAddPortfolioItem = useCallback(() => {
    setPortfolioItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        imageUrl: null,
        imageFile: null,
        tags: '',
        description: '',
        price: '',
        isEditing: true,
      },
    ]);
  }, []);

  const handleSavePortfolioItem = useCallback(async (id: string) => {
    const item = portfolioItems.find(item => item.id === id);
    if (!item) return;

    // Check if this is a new item (no imageUrl from server)
    const isNewItem = !item.imageUrl || item.imageUrl.startsWith('blob:');
    
    if (isNewItem && item.imageFile) {
      // Upload new portfolio item
      setPortfolioItems(prev => prev.map(item => 
        item.id === id ? { ...item, isUploading: true } : item
      ));

      try {
        const formData = new FormData();
        formData.append('merchant_email', merchantEmail);
        formData.append('image', item.imageFile);
        formData.append('tags', item.tags);
        formData.append('description', item.description);
        formData.append('price', item.price);

        const response = await fetch('/api/portfolio-upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          // Update the item with server data
          setPortfolioItems(prev => prev.map(item => 
            item.id === id ? { 
              ...item, 
              id: result.portfolio_id,
              imageUrl: result.image_url,
              isEditing: false,
              isUploading: false 
            } : item
          ));
          console.log('✅ Portfolio item uploaded successfully');
        } else {
          console.error('❌ Failed to upload portfolio item');
          setPortfolioItems(prev => prev.map(item => 
            item.id === id ? { ...item, isUploading: false } : item
          ));
        }
      } catch (error) {
        console.error('Error uploading portfolio item:', error);
        setPortfolioItems(prev => prev.map(item => 
          item.id === id ? { ...item, isUploading: false } : item
        ));
      }
    } else {
      // Just save the editing state for existing items
      setPortfolioItems(prev => prev.map(item => (item.id === id ? { ...item, isEditing: false } : item)));
    }
  }, [portfolioItems, merchantEmail]);

  const handleEditPortfolioItem = useCallback((id: string) => {
    setPortfolioItems(prev => prev.map(item => (item.id === id ? { ...item, isEditing: true } : item)));
  }, []);

  const handleDeletePortfolioItem = useCallback((id: string) => {
    setPortfolioItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Portfolio</h1>
      
      {/* Description tagline */}
      <p className="text-gray-600 mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <span className="flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Upload your past work to enhance AI responses to customer inquiries.
        </span>
      </p>
      
      <div className="space-y-6">
        {portfolioItems.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium text-gray-900">Portfolio Item</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSavePortfolioItem(item.id)}
                  disabled={item.isUploading}
                  className={`px-4 py-2 text-white rounded-md transition-opacity ${
                    item.isUploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#6C5DD3] hover:opacity-90'
                  }`}
                >
                  {item.isUploading ? 'Uploading...' : 'Save'}
                </button>
                <button
                  onClick={() => handleDeletePortfolioItem(item.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Upload Section */}
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {item.imageUrl ? (
                    <div className="relative">
                      <img
                        src={item.imageUrl}
                        alt="Portfolio item"
                        className="mx-auto max-h-48 rounded-lg"
                      />
                      <button
                        onClick={() => setPortfolioItems(prev => prev.map(p => p.id === item.id ? { ...p, imageUrl: null, imageFile: null } : p))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L40 40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 mb-2">Drag & drop or</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(item.id, e)}
                        className="hidden"
                        id={`image-upload-${item.id}`}
                      />
                      <label
                        htmlFor={`image-upload-${item.id}`}
                        className="inline-flex items-center px-4 py-2 bg-[#6C5DD3] text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Select an Image
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={item.tags}
                    onChange={(e) => handleFieldChange(item.id, 'tags', e.target.value)}
                    placeholder="e.g., #haircut #style"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                    placeholder="Enter description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="text"
                    value={item.price}
                    onChange={(e) => handleFieldChange(item.id, 'price', e.target.value)}
                    placeholder="e.g., 100 USD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Portfolio Button */}
        <div className="text-center">
          <button
            onClick={handleAddPortfolioItem}
            className="inline-flex items-center px-6 py-3 bg-[#6C5DD3] text-white rounded-md hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Portfolio
          </button>
        </div>
      </div>
    </div>
  );
} 