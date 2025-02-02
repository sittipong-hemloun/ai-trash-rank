'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api';
import { createReport, getRecentReports } from '@/utils/db/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import useUser from '@/hooks/useUser';
import useVerification from '@/hooks/useVerification';
import ReportForm from '@/components/ReportForm';
import ReportsTable from '@/components/ReportsTable';

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

// Updated libraries to include both 'maps' and 'places'
const libraries: Libraries = ['maps', 'places'];

interface Report {
  id: number;
  location: string;
  trashType: string;
  quantity: string;
  createdAt: string;
}

export default function ReportPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const {
    file,
    preview,
    setFile,
    previewImage,
    verificationStatus,
    verificationResult,
    handleVerify,
    isVerifying,
    resetVerification
  } = useVerification({
    mode: 'report',
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  useEffect(() => {
    // setCoordinates by current location
    async function setCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
        });
      }
    };

    setCurrentLocation();
  }, []);


  // Load Google Maps JavaScript API with unified options
  const { isLoaded } = useJsApiLoader({
    id: 'script-loader',
    googleMapsApiKey,
    libraries,
  });

  /**
   * Handles the loading of the Google Places SearchBox.
   * @param ref - The SearchBox reference.
   */
  const onLoad = useCallback((ref: google.maps.places.SearchBox) => setSearchBox(ref), []);

  /**
   * Handles the event when a place is selected from the SearchBox.
   */
  const onPlacesChanged = useCallback(() => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places[0]) {
        setLocation(places[0].formatted_address || '');
      }
    }
  }, [searchBox]);


  // setCoordinates by current location
  // async function setCurrentLocation() {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition((position) => {
  //       const lat = position.coords.latitude;
  //       const lng = position.coords.longitude;
  //       setCoordinates({ lat, lng });
  //     });
  //   }
  // };

  /**
   * Handles input changes for the report form.
   * @param e - The change event from the input fields.
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    console.log('name', name);
    console.log('value', value);
    setLocation(value);
  };

  /**
   * Handles the submission of a new trash report.
   * @param e - The form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || verificationStatus !== 'success') {
      toast.error('กรุณาตรวจสอบถังขยะหรือเข้าสู่ระบบก่อนส่ง');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('verificationResult', verificationResult);

      // setCurrentLocation();

      // await setCurrentLocation();

      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('lat', lat);
        console.log('lng', lng);
        // setCoordinates({ lat, lng });
      });

      // console.log('coordinates', coordinates);

      // async function setCoordinates() {
      //   await const result = navigator.geolocation.getCurrentPosition((position) => {
      //     const lat = position.coords.latitude;
      //     const lng = position.coords.longitude;
      //     console.log('lat', lat);
      //     console.log('lng', lng);
      //     return { lat, lng };
      //     // return convertToString;
      //   });
      //   // const convertToString = JSON.stringify({ lat, lng });

      //   const convertToString = JSON.stringify(result);
      //   console.log('convertToString', convertToString);

      //   return convertToString;
      // }

      // const coordinates = setCoordinates();

      console.log('coordinates', coordinates);


      const report = await createReport(
        user.id,
        location,
        verificationResult!.trashType || '',
        verificationResult!.quantity || '',
        preview || undefined,
        verificationResult,
        coordinates ? JSON.stringify(coordinates) : undefined
      );

      console.log('report', report);
      if (report) {
        setReports((prevReports) => [
          {
            id: report.id,
            location: report.location,
            trashType: report.trashType,
            quantity: report.quantity,
            createdAt: report.createdAt.toISOString(),
          },
          ...prevReports,
        ]);
      }
      toast.success('ส่งรายงานเรียบร้อยแล้ว!');

      // Clear the report form fields after successful submission
      resetVerification();
      setLocation('');
      router.push('/collect');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('ไม่สามารถส่งรายงานได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Fetches recent reports when the component mounts.
   */
  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      try {
        const recentReports = (await getRecentReports()).map((report) => ({
          ...report,
          createdAt: report.createdAt.toISOString(),
        }));
        setReports(recentReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast.error('ไม่สามารถส่งรายงานได้');
      }
    };

    fetchReports();
  }, [user]);

  /**
   * Redirects to home if user is not logged in and not loading.
   */
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('');
    }
  }, [userLoading, user, router]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin h-10 w-10 text-green-500" />
      </div>
    );
  }

  return (
    <div className="md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-200">รายงานขยะ</h1>

      {/* Trash Report Submission Form */}
      <ReportForm
        file={file}
        setFile={setFile}
        preview={previewImage}
        verificationStatus={verificationStatus}
        verificationResult={verificationResult}
        handleVerify={handleVerify}
        isVerifying={isVerifying}
        location={location}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isLoaded={isLoaded}
        onLoad={onLoad}
        onPlacesChanged={onPlacesChanged}
      />

      {/* Recent Reports Section */}
      <h2 className="text-3xl font-semibold mb-6 text-gray-200">รายงานขยะล่าสุด</h2>
      <ReportsTable reports={reports} />
    </div>
  );
}