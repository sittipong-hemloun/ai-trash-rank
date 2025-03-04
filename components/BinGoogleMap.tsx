import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
// import CuteTrashImg from '../public/images/cuteTrash.png';
import SeparatedWasteBinsIcon from '../public/images/bins/SeparatedWasteBinsIcon.png';
import MixedWasteBinsIcon from '../public/images/bins/MixedWasteBinIcon.png';
import useUser from '@/hooks/useUser';
import Bin from '@/types/bin';

type BinGoogleMapProps = {
  bins: Bin[];
  onMarkerClick?: (location: string) => void;
};

const containerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = { lat: 13.7563, lng: 100.5018 };

const BinGoogleMap: React.FC<BinGoogleMapProps> = ({ bins, onMarkerClick }) => {

  const { user } = useUser();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'script-loader',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['maps', 'places'],
  });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, []);

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading Maps...</div>;
  }

  console.log(bins);

  // Function to parse the location string as coordinates.
  const parseCoordinates = (location: string): { lat: number; lng: number } => {
    console.log(location);
    const parts = location.split(',');
    console.log(parts);
    const formattedParts = parts.map((part) => {
      return part.replace(/[^\d.-]/g, '');
    });

    console.log(formattedParts);

    const lat = parseFloat(formattedParts[0]);
    const lng = parseFloat(formattedParts[1]);

    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }

    return defaultCenter;
  };

  // const customIcon = {
  //   url: CuteTrashImg.src,
  //   scaledSize: new window.google.maps.Size(30, 40)
  // };

  const customIcon = (binType: string) => {
    switch (binType) {
      case 'separated':
        return {
          url: SeparatedWasteBinsIcon.src,
          scaledSize: new window.google.maps.Size(30, 40)
        };
      case 'mixed':
        return {
          url: MixedWasteBinsIcon.src,
          scaledSize: new window.google.maps.Size(30, 40)
        };
    }
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userLocation || defaultCenter}
      zoom={10}
    >
      {bins.filter(bin => bin.status === "active").map((bin) => {
        const position = parseCoordinates(bin.coordinates);
        console.log(position);
        return (
          <Marker
            key={bin.id}
            position={position}
            icon={customIcon(bin.type)}
            onClick={() => {
              if (onMarkerClick) {
                onMarkerClick(bin.coordinates);
              }
            }}
          />
        );
      })}
      {userLocation && (
        <div className=' rounded-full bg-white p-2'>
          <Marker
            icon={user?.profileImage ? { url: user.profileImage, scaledSize: new window.google.maps.Size(40, 40) } : undefined}
            position={userLocation}
          />
        </div>
      )}
    </GoogleMap>
  );
};

export default React.memo(BinGoogleMap);