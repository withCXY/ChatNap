'use client';

import { useState, useEffect } from 'react';

interface BusinessHour {
  day: string;
  hours: string;
}

interface BusinessData {
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

export default function BusinessInfo() {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with your actual API endpoint
        const response = await fetch('/api/business-info', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setBusinessData(data);
      } catch (err) {
        console.error('Failed to fetch business data:', err);
        setError('Failed to load business information');
        
        // Use default data when error occurs
        setBusinessData({
          companyName: "ChatNap",
          businessHours: [
            { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
            { day: "Saturday", hours: "10:00 AM - 4:00 PM" },
            { day: "Sunday", hours: "Closed" }
          ],
          address: {
            street: "123 Business Street",
            suite: "Suite 1001, Tech Park"
          },
          contact: {
            phone: "(123) 456-7890",
            email: "contact@example.com"
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, []);

  if (loading) {
    return (
      <div className="h-full p-6 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Loading business information...</p>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="h-full p-6 text-white flex items-center justify-center">
        <p>No business information available</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6 text-white">
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome to {businessData.companyName}</h1>
        {error && (
          <p className="text-xs text-yellow-300 mt-1">
            ⚠️ Using cached data
          </p>
        )}
      </div>

      {/* Business Hours */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Business Hours</h2>
        <div className="space-y-1 text-sm">
          {businessData.businessHours.map((item, index) => (
            <p key={index}>{item.day}: {item.hours}</p>
          ))}
        </div>
      </div>

      {/* Address */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Address</h2>
        <p className="text-sm">
          {businessData.address.street}
          <br />
          {businessData.address.suite}
        </p>
      </div>

      {/* Contact Information */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Contact</h2>
        <div className="space-y-1 text-sm">
          <p>Phone: {businessData.contact.phone}</p>
          <p>Email: {businessData.contact.email}</p>
        </div>
      </div>
    </div>
  );
} 