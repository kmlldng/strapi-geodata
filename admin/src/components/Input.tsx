import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple, LeafletMouseEvent, Map } from 'leaflet';

import { Box, Typography, JSONInput, TextInput, Button } from '@strapi/design-system';

import 'leaflet/dist/leaflet.css';
import { Field, Link } from '@strapi/design-system';
import { useField } from '@strapi/strapi/admin';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
  shadowUrl: shadowUrl,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

interface Location {
  lat: number;
  lng: number;
}

interface InputProps {
  value: Location;
  [key: string]: any;
}

const mapProps = {
  zoom: 7,
  center: [41.9, 12.5] as LatLngTuple,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: 'OSM attribution',
  tileAccessToken: '',
};

// Component to handle map click events
const MapClickHandler: React.FC<{ onMapClick: (e: LeafletMouseEvent) => void }> = ({ onMapClick }) => {
  useMapEvent('click', onMapClick);
  return null;
};

const Input: React.FC<InputProps> = ({ hint, labelAction, label, name, required, ...props }) => {
  const field = useField(name);
  const mapRef = useRef<Map>(null);
  const [location, _setLocation] = useState<any>(props.value);
  const searchRef = useRef<HTMLInputElement>(null);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onSetLocation({ lat: latitude, lng: longitude });
          mapRef.current?.panTo({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }

  const onMapClick = useCallback(
    (e: LeafletMouseEvent) => {
      let lat = parseFloat(e.latlng.lat.toString());
      let lng = parseFloat(e.latlng.lng.toString());
      onSetLocation({ lat, lng });
    },
    []
  );

  useEffect(() => {
    field.onChange(name, location);
  }, [location]);

  async function searchLocation(e: React.MouseEvent) {
    let search = searchRef.current?.value;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${search}&format=json`
    );
    const data = await response.json();
    if (data.length > 0) {
      let lat = parseFloat(data[0].lat);
      let lng = parseFloat(data[0].lon);
      onSetLocation({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
    }
  }

  const onSetLocation = ({ lat, lng }: { lat: number; lng: number }) => {
    _setLocation({ lat, lng });
  };

  const marginBottom = '1.5rem';
  const marginTop = '0.5rem';
  const display = 'block';

  return (
    <Field.Root error={props.error} name={name} id={name} hint={hint} required={required}>
      <Box>
        <Field.Label action={labelAction} style={{ marginBottom }}>
          {label}
        </Field.Label>

        <Box style={{ display: 'grid', gridTemplateColumns: '4fr 1fr 1fr', gap: '8px' }}>
          <TextInput ref={searchRef} name="search" placeholder="Address to search" />
          <Button onClick={searchLocation} size="l">
            Search
          </Button>
          <Button onClick={getCurrentLocation} size="l">
            Current Location
          </Button>
        </Box>

        <Typography variant="pi" style={{ marginBottom, display, marginTop }}>
          To set the location search for an address and press 'Search', or navigate on the map and click on the map.
        </Typography>

        <Box style={{ display: 'flex', height: '300px', width: '100%' }}>
          <Box style={{ width: '100% ', position: 'relative' }}>
            <MapContainer
              zoom={mapProps.zoom}
              center={
                props.value?.lat && props.value?.lng
                  ? [props.value?.lat, props.value?.lng]
                  : (mapProps.center as LatLngTuple)
              }
              ref={mapRef}
              style={{ height: '300px', zIndex: 299 }}
            >
              <TileLayer
                attribution={mapProps.tileAttribution}
                url={mapProps.tileUrl}
                accessToken={mapProps.tileAccessToken}
              />
              {location && <Marker position={[location?.lat, location?.lng]} icon={customIcon} />}
              <MapClickHandler onMapClick={onMapClick} />
            </MapContainer>
            {location && (
              <Link href={`https://maps.google.com/maps/place/${location?.lat},${location?.lng}`} target="_blank" style={{ backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', position: 'absolute', top: '8px', right: '8px', zIndex: 300, fontSize: '12px !important' }}>Open in Google Maps</Link>
            )}
          </Box>
        </Box>
        <JSONInput
          disabled
          name={props.name}
          value={
            typeof field.value == 'object'
              ? JSON.stringify(field.value, null, 2)
              : field.value
          }
          onChange={(e: any) => onSetLocation(e)}
          style={{ height: '9rem' }}
        />
        <Field.Hint />
        <Field.Error />
      </Box>
    </Field.Root>
  );
};

export default Input;
