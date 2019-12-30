import React, { useState, useLayoutEffect, useEffect } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api'

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

const App = () => {
  const [width, height] = useWindowSize();
  return (
    <>
      <LoadScript
        id="script-loader"
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      >
        <GoogleMap
          id='example-map'
          mapContainerStyle={{
            height: height,
            width: width
          }}
          zoom={11}
          center={{
            lat: 46.4986344,
            lng: 15.0653958
          }}
        >
        </GoogleMap>
      </LoadScript>
    </>
  )
}

export default App;