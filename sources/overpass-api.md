https://overpass-turbo.eu

[out:json][timeout:25];
// gather results
nwr["amenity"="coworking_space"]({{bbox}});
// print results
out geom;

[out:json][timeout:25];
// gather results
nwr["leisure"="hackerspace"]({{bbox}});
// print results
out geom;

[out:json][timeout:25];
// gather results
nwr["shop"="doityourself"]({{bbox}});
// print results
out geom;

