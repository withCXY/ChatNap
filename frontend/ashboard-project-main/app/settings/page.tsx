'use client';

import React, { useState, useCallback } from 'react';

interface BusinessHour {
  id: string;
  day: string;
  hours: string;
  isEditing: boolean;
}

interface BusinessProfile {
  companyName: string;
  businessHours: BusinessHour[];
  address: {
    street: string;
    suite: string;
  };
  contact: {
    phone: string;
    email: string;
  };
}

export default function SettingsPage() {
  // Business Profile state
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    companyName: '',
    businessHours: [],
    address: {
      street: '',
      suite: ''
    },
    contact: {
      phone: '',
      email: ''
    }
  });

  // Basic Info state
  const [basicInfoFiles, setBasicInfoFiles] = useState<File[]>([]);

  // FAQ state
  const [faqFile, setFaqFile] = useState<File | null>(null);
  const [manualFaqs, setManualFaqs] = useState<{ id: string; question: string; answer: string; isEditing: boolean }[]>([]);

  // Pricing state
  const [pricingItems, setPricingItems] = useState<{ id: string; name: string; price: string; currency: string; isEditing: boolean }[]>([]);

  // Business Profile handlers
  const handleBusinessProfileChange = (field: keyof BusinessProfile, value: any) => {
    setBusinessProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: keyof BusinessProfile['address'], value: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleContactChange = (field: keyof BusinessProfile['contact'], value: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  const handleAddBusinessHour = useCallback(() => {
    const newHour: BusinessHour = {
      id: Math.random().toString(36).substring(2, 9),
      day: '',
      hours: '',
      isEditing: true
    };
    setBusinessProfile(prev => ({
      ...prev,
      businessHours: [...prev.businessHours, newHour]
    }));
  }, []);

  const handleBusinessHourChange = useCallback((id: string, field: 'day' | 'hours', value: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      businessHours: prev.businessHours.map(hour => 
        hour.id === id ? { ...hour, [field]: value } : hour
      )
    }));
  }, []);

  const handleDeleteBusinessHour = useCallback((id: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      businessHours: prev.businessHours.filter(hour => hour.id !== id)
    }));
  }, []);

  const handleSaveBusinessHour = useCallback((id: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      businessHours: prev.businessHours.map(hour => 
        hour.id === id ? { ...hour, isEditing: false } : hour
      )
    }));
  }, []);

  const handleEditBusinessHour = useCallback((id: string) => {
    setBusinessProfile(prev => ({
      ...prev,
      businessHours: prev.businessHours.map(hour => 
        hour.id === id ? { ...hour, isEditing: true } : hour
      )
    }));
  }, []);

  // Handlers for file uploads
  const handleBasicInfoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setBasicInfoFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveBasicInfoFile = (indexToRemove: number) => {
    setBasicInfoFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleFaqFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFaqFile(e.target.files[0]);
      // TODO: Optionally parse Q&A pairs from the file here
    }
  };

  // Handlers for manual FAQ editor
  const handleAddFaq = useCallback(() => {
    setManualFaqs(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), question: '', answer: '', isEditing: true }]);
  }, []);

  const handleFaqChange = useCallback((id: string, field: 'question' | 'answer', value: string) => {
    setManualFaqs(prev => prev.map(faq => faq.id === id ? { ...faq, [field]: value } : faq));
  }, []);

  const handleDeleteFaq = useCallback((id: string) => {
    setManualFaqs(prev => prev.filter(faq => faq.id !== id));
  }, []);

  const handleSaveFaq = useCallback((id: string) => {
    setManualFaqs(prev => prev.map(faq => faq.id === id ? { ...faq, isEditing: false } : faq));
  }, []);

  const handleEditFaq = useCallback((id: string) => {
    setManualFaqs(prev => prev.map(faq => faq.id === id ? { ...faq, isEditing: true } : faq));
  }, []);

  // Handlers for pricing items
  const handleAddPricingItem = useCallback(() => {
    setPricingItems(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), name: '', price: '', currency: 'USD', isEditing: true }]);
  }, []);

  const handlePricingItemChange = useCallback((id: string, field: 'name' | 'price' | 'currency', value: string | number) => {
    setPricingItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const handleDeletePricingItem = useCallback((id: string) => {
    setPricingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleSavePricingItem = useCallback((id: string) => {
    setPricingItems(prev => prev.map(item => item.id === id ? { ...item, isEditing: false } : item));
  }, []);

  const handleEditPricingItem = useCallback((id: string) => {
    setPricingItems(prev => prev.map(item => item.id === id ? { ...item, isEditing: true } : item));
  }, []);

  // Save Logic
  const handleSave = async () => {
    try {
      // 1. Upload basic info files
      const uploadedFiles = [];
      for (const file of basicInfoFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', 'faq');
        formData.append('session_id', 'merchant');

        const response = await fetch('http://localhost:8000/api/merchant/upload-document', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          uploadedFiles.push(result);
          console.log(`✅ Uploaded ${file.name}`);
        } else {
          console.error(`❌ Failed to upload ${file.name}`);
        }
      }

      // 2. Save business settings
      const businessSettingsData = {
        business_name: businessProfile.companyName,
        address: `${businessProfile.address.street} ${businessProfile.address.suite}`.trim(),
        phone: businessProfile.contact.phone,
        email: businessProfile.contact.email,
        description: `Business with services: ${pricingItems.map(item => item.name).join(', ')}`
      };

      const settingsResponse = await fetch('http://localhost:8000/api/merchant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessSettingsData)
      });

      // 3. Save business hours
      const businessHoursData = businessProfile.businessHours
        .filter(hour => hour.day && hour.hours)
        .map((hour, index) => ({
          day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(hour.day),
          open_time: hour.hours.split(' - ')[0] || '09:00',
          close_time: hour.hours.split(' - ')[1] || '17:00',
          is_open: true
        }));

      if (businessHoursData.length > 0) {
        const hoursResponse = await fetch('http://localhost:8000/api/merchant/business-hours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(businessHoursData)
        });
      }

      // 4. Save service pricing to database (could be added to merchant_settings as JSON)
      const pricingData = pricingItems
        .filter(item => item.name && item.price)
        .map(item => ({
          name: item.name,
          price: parseFloat(item.price) || 0,
          currency: item.currency
        }));

      if (pricingData.length > 0) {
        const pricingResponse = await fetch('http://localhost:8000/api/merchant/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pricing_services: JSON.stringify(pricingData)
          })
        });
      }

      // 5. Save manual FAQs as a document
      if (manualFaqs.length > 0) {
        const faqContent = manualFaqs
          .filter(faq => faq.question && faq.answer)
          .map(faq => `Q: ${faq.question}\nA: ${faq.answer}\n\n`)
          .join('');

        if (faqContent.trim()) {
          const faqBlob = new Blob([faqContent], { type: 'text/plain' });
          const faqFormData = new FormData();
          faqFormData.append('file', faqBlob, 'manual_faqs.txt');
          faqFormData.append('document_type', 'faq');
          faqFormData.append('session_id', 'merchant');

          const faqResponse = await fetch('http://localhost:8000/api/merchant/upload-document', {
            method: 'POST',
            body: faqFormData
          });
        }
      }

      alert("✅ All settings saved successfully! Your AI agent can now use this information to help customers.");
      
    } catch (error) {
      console.error('Error saving settings:', error);
      alert("❌ Some settings failed to save. Please check the console for details.");
    }
  };

  return (
    <main className="flex-1 p-8 bg-white rounded-lg shadow-sm ml-64"> {/* Note: ml-64 is for testing, layout.tsx should handle it */}
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Settings</h1>

      {/* Business Profile Section */}
      <section className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-700">Business Profile</h2>
        
        {/* Store Name */}
        <div className="mb-6">
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
          <input
            type="text"
            id="companyName"
            value={businessProfile.companyName}
            onChange={(e) => handleBusinessProfileChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
            placeholder="Enter your store name"
          />
        </div>

        {/* Business Hours */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">Business Hours</label>
            <button
              type="button"
              onClick={handleAddBusinessHour}
              className="px-3 py-1 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors flex items-center gap-1 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Add Hours
            </button>
          </div>
          
          {businessProfile.businessHours.length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-white rounded-md border border-gray-200">
              <p className="text-sm">No business hours added yet. Click "Add Hours" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {businessProfile.businessHours.map((hour) => (
                <div key={hour.id} className="bg-white p-4 rounded-md border border-gray-200">
                  {hour.isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`day-${hour.id}`} className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                        <select
                          id={`day-${hour.id}`}
                          value={hour.day}
                          onChange={(e) => handleBusinessHourChange(hour.id, 'day', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                        >
                          <option value="">Select day</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`hours-${hour.id}`} className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                        <input
                          type="text"
                          id={`hours-${hour.id}`}
                          value={hour.hours}
                          onChange={(e) => handleBusinessHourChange(hour.id, 'hours', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                          placeholder="e.g., 9:00 AM - 6:00 PM"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-800">{hour.day}: </span>
                        <span className="text-gray-600">{hour.hours}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-3 gap-2">
                    {hour.isEditing ? (
                      <button
                        type="button"
                        onClick={() => handleSaveBusinessHour(hour.id)}
                        className="px-3 py-1 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors text-sm"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEditBusinessHour(hour.id)}
                        className="px-3 py-1 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors text-sm"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteBusinessHour(hour.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Address */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input
                type="text"
                id="street"
                value={businessProfile.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                placeholder="Enter street address"
              />
            </div>
            <div>
              <label htmlFor="suite" className="block text-sm font-medium text-gray-700 mb-1">Suite</label>
              <input
                type="text"
                id="suite"
                value={businessProfile.address.suite}
                onChange={(e) => handleAddressChange('suite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                placeholder="Enter suite/unit number"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                id="phone"
                value={businessProfile.contact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email"
                value={businessProfile.contact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                placeholder="Enter email address"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Basic Info Upload Section */}
      <section className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-700">Basic Info</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
          {basicInfoFiles.length > 0 ? (
            <div>
              <div className="mb-4">
                <p className="text-lg text-gray-700 mb-3">Uploaded Files:</p>
                <div className="space-y-2">
                  {basicInfoFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-2">
                      <span className="font-medium text-gray-800">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBasicInfoFile(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleBasicInfoFileUpload}
                className="hidden"
                id="basicInfoFileInput"
                multiple
              />
              <label
                htmlFor="basicInfoFileInput"
                className="inline-flex items-center px-4 py-2 bg-[#6C5DD3] text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              >
                Add More Files
              </label>
              <p className="mt-2 text-sm text-gray-500"> Upload your business intro, FAQs, pricing, and other details for AI-assisted replies.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L40 32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">Drag and drop or</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleBasicInfoFileUpload}
                className="hidden"
                id="basicInfoFileInput"
                multiple
              />
              <label
                htmlFor="basicInfoFileInput"
                className="mt-2 inline-flex items-center px-4 py-2 bg-[#6C5DD3] text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity"
              >
                Upload files
              </label>
              <p className="mt-2 text-sm text-gray-500"> Upload your business intro, FAQs, pricing, and other details for AI-assisted replies.</p>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl mb-6 text-gray-700">
          <span className="font-bold">Custom</span>
        </h2>
        
        {/* Custom FAQs Section */}
        <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Frequently Asked Questions</h3>
          </div>
          
          {manualFaqs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <button
                type="button"
                onClick={handleAddFaq}
                className="mb-4 px-4 py-2 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors flex items-center gap-2 text-sm mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/></svg>
                Add New Q&A
              </button>
              <p className="text-sm">Add or update FAQ anytime as new questions come up.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-4 py-2 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors flex items-center gap-2 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/></svg>
                  Add New Q&A
                </button>
              </div>
              <div className="space-y-4">
                {manualFaqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                    {faq.isEditing ? (
                      <>
                        <div className="mb-3">
                          <label htmlFor={`question-${faq.id}`} className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                          <input
                            type="text"
                            id={`question-${faq.id}`}
                            value={faq.question}
                            onChange={(e) => handleFaqChange(faq.id, 'question', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                            placeholder="Enter question"
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor={`answer-${faq.id}`} className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                          <textarea
                            id={`answer-${faq.id}`}
                            value={faq.answer}
                            onChange={(e) => handleFaqChange(faq.id, 'answer', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                            placeholder="Enter answer"
                          ></textarea>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="font-semibold text-gray-800 mb-2">Q: {faq.question}</h4>
                        <p className="text-gray-600 mb-2">A: {faq.answer}</p>
                      </>
                    )}
                    <div className="flex justify-end mt-4 gap-2">
                      {faq.isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSaveFaq(faq.id)}
                          className="px-3 py-1 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors text-sm"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditFaq(faq.id)}
                          className="px-3 py-1 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors text-sm"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Items Section */}
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Service Pricing</h3>
          </div>
          
          {pricingItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <button
                type="button"
                onClick={handleAddPricingItem}
                className="mb-4 px-4 py-2 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors flex items-center gap-2 text-sm mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/></svg>
                Add Service & Price
              </button>
              <p className="text-sm">Add services and prices as needed.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleAddPricingItem}
                  className="px-4 py-2 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors flex items-center gap-2 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/></svg>
                  Add Service & Price
                </button>
              </div>
              <div className="space-y-4">
                {pricingItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                    {item.isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                        <div>
                          <label htmlFor={`service-name-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                          <input
                            type="text"
                            id={`service-name-${item.id}`}
                            value={item.name}
                            onChange={(e) => handlePricingItemChange(item.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                            placeholder="e.g., Long Hair Styling"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label htmlFor={`service-price-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                            <input
                              type="text"
                              id={`service-price-${item.id}`}
                              value={item.price}
                              onChange={(e) => handlePricingItemChange(item.id, 'price', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm custom-number-input"
                              placeholder="e.g., 88"
                            />
                          </div>
                          <div>
                            <label htmlFor={`service-currency-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select
                              id={`service-currency-${item.id}`}
                              value={item.currency}
                              onChange={(e) => handlePricingItemChange(item.id, 'currency', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#6C5DD3] focus:border-[#6C5DD3] sm:text-sm"
                            >
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="CNY">CNY</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-semibold text-gray-800 mb-1">Service: {item.name}</h4>
                        <p className="text-gray-600">Price: {item.price} {item.currency}</p>
                      </>
                    )}
                    <div className="flex justify-end mt-4 gap-2">
                      {item.isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleSavePricingItem(item.id)}
                          className="px-3 py-1 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors text-sm"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditPricingItem(item.id)}
                          className="px-3 py-1 bg-[#6C5DD3] text-white rounded-md hover:bg-[#5A4BC4] transition-colors text-sm"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePricingItem(item.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 bg-[#6C5DD3] text-white font-bold rounded-md hover:opacity-90 transition-opacity"
        >
          Save All Settings
        </button>
      </div>
    </main>
  );
} 