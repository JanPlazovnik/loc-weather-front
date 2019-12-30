import React, { useState, useLayoutEffect, useEffect } from 'react';
import { withStyles, TextField, Button, Divider } from '@material-ui/core';
import { GoogleMap, LoadScript } from '@react-google-maps/api' // https://github.com/JustFly1984/react-google-maps-api
import { geolocated } from 'react-geolocated'; // https://github.com/no23reason/react-geolocated

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

const CssTextField = withStyles({
  root: {
    '& label.Mui-focused': {
      color: '#4caf50',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: '#4caf50',
    },
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: '#4caf50',
      },
    },
  },
})(TextField);

const App = ({isGeolocationAvailable, isGeolocationEnabled, coords }) => {
  const [width, height] = useWindowSize();
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    console.log("definitely updated locations array");
  }, [locations]);

  const addLocation = (value) => {
    if(value.length > 0) {
      setLocations([...locations, value])
    }
  }

  // location item component
  const LocationItem = ({name, index}) => <>
    <div className="location-item">
      <span className="location-item-index">#{index + 1}</span>
      <span>{name}</span>
    </div>
  </>

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
        {
          locations.map((loc, key) => {
            return (<LocationItem name={loc} index={key} key={key}></LocationItem>)
          })
        }
        <CssTextField id="outlined-basic" label="Add a location" variant="outlined" className="add-location-field" size="small" value={query} onChange={(e) => setQuery(e.target.value)}/>
        <Button variant="contained" color="primary" className="add-location-button" onClick={() => {addLocation(query)}}>
          Add
        </Button>
        <Divider/>
        <p className="author">&copy; Jan Plazovnik</p>
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