import React, { useState, useLayoutEffect, useEffect } from 'react';
import { withStyles, makeStyles, TextField, Button, Divider, InputLabel, MenuItem, FormControl, Select } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { GoogleMap, LoadScript, InfoWindow, Circle } from '@react-google-maps/api' // https://github.com/JustFly1984/react-google-maps-api
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import arrayMove from 'array-move';
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

const useStyles = makeStyles(theme => ({
  formControl: {
    marginTop: theme.spacing(1.5),
    width: '100%',
  }
}));

Array.prototype.last = function() {
  return this[this.length - 1];
}

const MainComponent = () => {
  const [width, height] = useWindowSize();
  const [mapCenter, setMapCenter] = useState({ lat: 46.056946, lng: 14.505751 })
  // const [locations, setLocations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState("");
  const [searchList, setSearchlist] = useState([]); 
  const [isSearchLoading, setIsSearchLoading] = useState(false); 
  const [searchTimeout, setSearchTimeout] = useState(0);
  const [returnedRoute, setReturnedRoute] = useState([]);
  const [deleteLocation, setDeleteLocation] = useState('');
  const [labelWidth, setLabelWidth] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const classes = useStyles();
  const inputLabel = React.useRef(null);

  useEffect(() => {
    setLabelWidth(inputLabel.current.offsetWidth);
  }, []);

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
          .catch((err) => {console.log(err); enqueueSnackbar(err.response.data, {variant: 'error', autoHideDuration: 3000, anchorOrigin: {vertical: 'bottom', horizontal: 'center'}})});
      }, 300)
    );
  }, [query]);
  
  useEffect(() => {
    setIsSearchLoading(false);
  }, [searchList]);

  const handleDeleteChange = (event) => {
    setDeleteLocation(event.target.value);
  };

  const removeLocation = () => {
    if(deleteLocation === "all")
      setLocations([]);
    else {
      let arr = locations;
      let index = arr.indexOf(deleteLocation);
      arr.splice(index, 1)
      setLocations(arr);
    }
    setDeleteLocation('');
    setReturnedRoute([]);
  }

  const addLocation = (value) => {
    if(value.length > 0) {
      if(locations.last() === value)
        return enqueueSnackbar("New location can't be the same as last location", {variant: 'error', autoHideDuration: 3000, anchorOrigin: {vertical: 'bottom', horizontal: 'center'}});
      setLocations([...locations, value])
      setQuery("");
    }
  }

  const SortableItem = SortableElement(({value}) => <>
    <div className="location-item">
      <span className="location-item-index">#{value[1] + 1}</span>
      <span>{value[0]}</span>
    </div>
  </>);

  const SortableList = SortableContainer(({items}) => {
    return (
      <ul>
        {items.map((value, index) => (
          <SortableItem key={`item-${index}`} index={index} value={[value, index]} />
        ))}
      </ul>
    );
  });

  const onSortEnd = ({oldIndex, newIndex}) => {
    setLocations(arrayMove(locations, oldIndex, newIndex));
  };

  const fetchRoutes = (locations) => {
    axios
      .post(process.env.REACT_APP_LOCATIONS_API_URI, {locations})
      .then((res) => {setReturnedRoute(res.data); setMapCenter({lat: res.data[Math.round(res.data.length / 2)].lat, lng: res.data[Math.round(res.data.length / 2)].lon})})
      .catch((err) => {
        console.log(err);
        if(err.response && Object.entries(err.response.data).length === 0 && err.response.data.constructor === Object)
          enqueueSnackbar("Couldn't find a route", {variant: 'error', autoHideDuration: 3000, anchorOrigin: {vertical: 'bottom', horizontal: 'center'}});
        else
          enqueueSnackbar(err.response.data, {variant: 'error', autoHideDuration: 3000, anchorOrigin: {vertical: 'bottom', horizontal: 'center'}});
      });
  }

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
          returnedRoute.map((marker, key) => {
            // return (<Marker position={{lat: marker.lat, lng: marker.lon}} key={key}/>)
            return (<>
              <InfoWindow position={{lat: marker.lat, lng: marker.lon}} key={"infowindow-" + key}>
                <div style={{
                  background: 'white',
                  fontSize: '1em'
                }}>
                <h1>{marker.weather.type}</h1>
                <h1>{marker.weather.temp} °C</h1>
                <p style={{fontSize: '0.8em', textAlign: 'center'}}>{key + 1}</p>
                </div>
              </InfoWindow>
              <Circle center={{lat: marker.lat, lng: marker.lon}} key={"circle-" + key} options={
                {
                  strokeColor: '#FF0000',
                  strokeOpacity: 0.6,
                  strokeWeight: 2,
                  fillColor: '#FF0000',
                  fillOpacity: 0.35,
                  clickable: false,
                  draggable: false,
                  editable: false,
                  visible: true,
                  radius: 1000,
                  zIndex: 1}
                }
              />
            </>
            )
          })
        }
        </GoogleMap>
      </LoadScript>
      <div className="route-planner">
        <SortableList items={locations} onSortEnd={onSortEnd} helperClass="location-item"/>
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
        <Button variant="contained" color="primary" className="btn" fullWidth onClick={() => {addLocation(query)}}>
          Add
        </Button>
        <FormControl variant="outlined" size="small" className={classes.formControl}>
          <InputLabel ref={inputLabel} id="remove-location-label">
            Remove a location
          </InputLabel>
          <Select
            labelId="remove-location-label"
            id="remove-location"
            value={deleteLocation}
            onChange={handleDeleteChange}
            labelWidth={labelWidth}
            // can't get custom styling for this to work, so it's just gonna stay blue.
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            <MenuItem value="all">
              <em>All</em>
            </MenuItem>
            {
              locations.map((loc, key) => {
                return <MenuItem value={loc} key={"delete" + key}>{loc}</MenuItem>
              })
            }
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" className="btn" fullWidth onClick={() => {removeLocation()}}>
          Remove
        </Button>
        <Button variant="contained" color="primary" className="btn" fullWidth onClick={() => {fetchRoutes(locations)}}>
          Find optimal route
        </Button>
        <Divider/>
        <p className="author">&copy; Jan Plazovnik</p>
      </div>
    </>
  )
}

// have to separate them or snackbarprovider won't work
export default function App() {
  const notistackRef = React.createRef();
  const onClickDismiss = key => () => { 
      notistackRef.current.closeSnackbar(key);
  }
  return (
    <SnackbarProvider maxSnack={3} ref={notistackRef} action={(key) => (<Button style={{color: '#ffffff'}}onClick={onClickDismiss(key)}>Dismiss</Button>)}>
      <MainComponent />
    </SnackbarProvider> 
  )
};