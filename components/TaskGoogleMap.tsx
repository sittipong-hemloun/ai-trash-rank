import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import CollectionTask from '@/types/collectionTask';

type TaskGoogleMapProps = {
  tasks: CollectionTask[];
};

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = { lat: 13.7563, lng: 100.5018 };

const TaskGoogleMap: React.FC<TaskGoogleMapProps> = ({ tasks }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'script-loader',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['maps', 'places'],
  });

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading Maps...</div>;
  }

  console.log(tasks);

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

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={10}
    >
      {tasks.map((task) => {
        const position = parseCoordinates(task.coordinates);
        console.log(position);
        return <Marker key={task.id} position={position} />;
      })}
    </GoogleMap>
  );
};

export default React.memo(TaskGoogleMap);