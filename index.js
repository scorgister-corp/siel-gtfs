const fs = require("fs-extra");
const unzipper = require("unzipper");
const path = require("path");
const csvParser = require("csv-parser");

const GTFS_DIR = "./gtfs_data";
const GTFS_JSON_DIR = "./gtfs";
const GTFS_ZIP = "GTFS.zip";

async function extractGTFS(zipFilePath, outputDir) {
    await fs.ensureDir(outputDir);
    return fs
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: outputDir }))
      .promise();
}
  
async function loadObject(gtfsDir, filename, indextionKey) {
    return new Promise((resolve, reject) => {
      const stops = {};
      fs.createReadStream(path.join(gtfsDir, filename))
        .pipe(csvParser())
        .on("data", (row) => {
          stops[row[indextionKey]] = row;
        })
        .on("end", () => resolve(stops))
        .on("error", reject);
    });
}

async function load(gtfsDir, filename) {
    return new Promise((resolve, reject) => {
      const stops = [];
      fs.createReadStream(path.join(gtfsDir, filename))
        .pipe(csvParser())
        .on("data", (row) => {
          stops.push(row);
        })
        .on("end", () => resolve(stops))
        .on("error", reject);
    });
}
async function loadStop() {
    await fs.ensureDir(GTFS_JSON_DIR);
    fs.writeFileSync(GTFS_JSON_DIR + "/stops.json", JSON.stringify(await loadObject(GTFS_DIR, "stops.txt", "stop_id")));
}

async function loadRoutes() {
    await fs.ensureDir(GTFS_JSON_DIR);
    fs.writeFileSync(GTFS_JSON_DIR + "/routes.json", JSON.stringify(await loadObject(GTFS_DIR, "routes.txt", "route_id")));
}

async function loadTrips() {
    await fs.ensureDir(GTFS_JSON_DIR);
    fs.writeFileSync(GTFS_JSON_DIR + "/trips.json", JSON.stringify(await loadObject(GTFS_DIR, "trips.txt", "trip_id")));
}

async function loadCalendarDates() {
    await fs.ensureDir(GTFS_JSON_DIR);
    fs.writeFileSync(GTFS_JSON_DIR + "/calendar_dates.json", JSON.stringify(await load(GTFS_DIR, "calendar_dates.txt")));
}

async function loadStopTimes() {
    const stops = {};
    fs.createReadStream(path.join(GTFS_DIR, "stop_times.txt"))
        .pipe(csvParser())
        .on("data", (row) => {
            if(!stops[row.trip_id]) 
                stops[row.trip_id] = {}
            
            stops[row.trip_id][row.stop_id] = row.departure_time;
        })
        .on("end", () =>  {
            fs.writeFileSync(GTFS_JSON_DIR + "/stop_times.json", JSON.stringify(stops));

        });
}

async function loadDirections() {
    await fs.ensureDir(GTFS_JSON_DIR);
    fs.writeFileSync(GTFS_JSON_DIR + "/calendar_dates.json", JSON.stringify(await load(GTFS_DIR, "calendar_dates.txt")));
}

async function loadStops() {
    await fs.ensureDir(GTFS_JSON_DIR);
    fs.writeFileSync(GTFS_JSON_DIR + "/stops.json", JSON.stringify(await loadObject(GTFS_DIR, "stops.txt", "stop_id")));
}
  
(async () => {  
    await extractGTFS(GTFS_ZIP, GTFS_DIR);
    loadStop();
    loadRoutes();
    loadTrips();
    loadCalendarDates();
    loadStopTimes();
    loadStops();
    
})().then(() => {
    console.log("Data exported");
});
