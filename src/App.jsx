import React, { useState, useLayoutEffect } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api'
import { geolocated } from 'react-geolocated';

// style
import './scss/planner.scss';

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

const App = ({isGeolocationAvailable, isGeolocationEnabled, coords }) => {
  const [width, height] = useWindowSize();

  // add a snackbar for the next two
  // console.log(isGeolocationAvailable);
  // console.log(isGeolocationEnabled);

  return (
    <>
      <LoadScript id="script-loader" googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          id='google-map'
          mapContainerStyle={{ height: height, width: width }}
          zoom={11}
          center={{ lat: 46.4986344, lng: 15.0653958 }}
        >
        </GoogleMap>
      </LoadScript>
      <div className="route-planner">
      </div>
    </>
  )
}

export default geolocated({
  positionOptions: {
      enableHighAccuracy: false,
  },
  userDecisionTimeout: 5000,
})(App);