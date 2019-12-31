import React, { useState, useLayoutEffect, useEffect } from 'react';
import { withStyles, TextField, Button, Divider } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { InfoWindow, GoogleMap, LoadScript } from '@react-google-maps/api' // https://github.com/JustFly1984/react-google-maps-api
import { geolocated } from 'react-geolocated'; // https://github.com/no23reason/react-geolocated
import * as axios from 'axios';
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
  const [mapCenter, setMapCenter] = useState({ lat: 46.4986344, lng: 15.0653958 })
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState("");
  const [searchList, setSearchlist] = useState([]); 
  const [isSearchLoading, setIsSearchLoading] = useState(false); 
  const [searchTimeout, setSearchTimeout] = useState(0);
  const [returnedRoute, setReturnedRoute] = useState([]);

  useEffect(() => {
    console.log("definitely updated locations array");
  }, [locations]);

  useEffect(() => {
    if(query.length === 0) return;
    if(searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        setIsSearchLoading(true);
          axios
          .get('https://devru-latitude-longitude-find-v1.p.rapidapi.com/latlon.php', 
          {
            params: {
              location: query
            }, 
            headers: {
              "x-rapidapi-host": 'devru-latitude-longitude-find-v1.p.rapidapi.com',
              "x-rapidapi-key": process.env.REACT_APP_RAPID_API_KEY
            }
          })
          .then((res) => {setSearchlist(res.data.Results)})
          .catch((err) => console.log(err));
      }, 300)
    );
  }, [query]);
  
  useEffect(() => {
    setIsSearchLoading(false);
  }, [searchList]);

  const addLocation = (value) => {
    if(value.length > 0) {
      setLocations([...locations, value])
      setQuery("");
    }
  }

  const fetchRoutes = (locations) => {
    console.log(process.env.REACT_APP_LOCATIONS_API_URI);
    axios
      .post(process.env.REACT_APP_LOCATIONS_API_URI, {locations})
      .then((res) => {console.log(res.data); setReturnedRoute(res.data)})
      .catch((err) => console.log(err));
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
          center={mapCenter}
        >
          {
            (returnedRoute.length > 0)
            ? returnedRoute.map((marker, key) => {
              // return (<Marker position={{lat: marker.lat, lng: marker.lon}} key={key}/>)
              return (<InfoWindow position={{lat: marker.lat, lng: marker.lon}} key={key}>
                <div style={{
                  background: 'white',
                  fontSize: '0.9em',
                  borderBottom: '1px solid black'
                }}>
                <h1>{marker.weather.type}</h1>
                <h1>{marker.weather.temp} °C</h1>
                </div>
              </InfoWindow>)
            })
            : null
          }
        </GoogleMap>
      </LoadScript>
      <div className="route-planner">
        {
          locations.map((loc, key) => {
            return (<LocationItem name={loc} index={key} key={key}></LocationItem>)
          })
        }
        <Autocomplete
          includeInputInList
          options={searchList}
          getOptionLabel={option => `${option.name}`}
          loading={isSearchLoading}
          loadingText="Searching..."
          renderInput={params => {
            setQuery(params.inputProps.value);
            return (<CssTextField {...params} label="Add a location" variant="outlined" size="small" fullWidth/>)
          }}
        />
        <Button variant="contained" color="primary" className="add-location-button" onClick={() => {addLocation(query)}}>
          Add
        </Button>
        <Button variant="contained" color="primary" className="add-location-button" onClick={() => {fetchRoutes(locations)}}>
          Find optimal route
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