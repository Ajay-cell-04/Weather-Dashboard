// --- ASYNCHRONOUS WEATHER PROCESSOR LOGIC ---
document.addEventListener("DOMContentLoaded", function () {
    const cityInput = document.getElementById("city-input");
    const searchBtn = document.getElementById("search-btn");
    const errorMessage = document.getElementById("error-message");
    const loadingMessage = document.getElementById("loading");
    const weatherResult = document.getElementById("weather-result");

    const locationName = document.getElementById("location-name");
    const tempValue = document.getElementById("temp-value");
    const humidityValue = document.getElementById("humidity-value");
    const windValue = document.getElementById("wind-value");
    const statusValue = document.getElementById("status-value");

    // Weather Code Dictionary Mapper to interpret nested response integers
    const weatherCodes = {
        0: "Clear Sky",
        1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing Rime Fog",
        51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
        61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
        71: "Slight Snow Fall", 73: "Moderate Snow Fall", 75: "Heavy Snow Fall",
        80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
        95: "Thunderstorm"
    };

    // Modified helper function that accepts a city name directly or reads from the input field
    async function fetchWeatherMetrics(targetCity = null) {
        // If a targetCity is passed (from database load), use it; otherwise, read from the input box.
        const cityName = typeof targetCity === 'string' ? targetCity : cityInput.value.trim();
        if (cityName === "") return;

        // Reset display states
        errorMessage.classList.add("hidden");
        weatherResult.classList.add("hidden");
        loadingMessage.classList.remove("hidden");

        try {
            // STEP 1: Fetch Geocoding Geolocation REST Nodes (Latitude & Longitude coordinates)
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
            const geoResponse = await fetch(geoUrl);
            
            if (!geoResponse.ok) throw new Error("Failed network response from Geocoding server.");
            
            const geoData = await geoResponse.json();
            
            // Error Handling if array payload is absent
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error(`City "${cityName}" not detected. Please verify input spelling.`);
            }

            const location = geoData.results[0];
            const lat = location.latitude;
            const lon = location.longitude;
            const properName = `${location.name}, ${location.country}`;

            // STEP 2: Fetch Weather payload using asynchronous async/await pipelines
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
            const weatherResponse = await fetch(weatherUrl);

            if (!weatherResponse.ok) throw new Error("Weather service interface error.");

            const weatherData = await weatherResponse.json();

            // STEP 3: Parse and dynamically render nested JSON variables to the DOM
            const currentMetrics = weatherData.current;
            
            locationName.textContent = properName;
            tempValue.textContent = Math.round(currentMetrics.temperature_2m);
            humidityValue.textContent = `${currentMetrics.relative_humidity_2m}%`;
            windValue.textContent = `${currentMetrics.wind_speed_10m} km/h`;
            
            // Code block resolving nested metadata status mappings
            const code = currentMetrics.weather_code;
            statusValue.textContent = weatherCodes[code] || "Unspecified Dynamics";

            // Render output node visible
            weatherResult.classList.remove("hidden");

            // --- DATABASE STORAGE INTEGRATION ---
            // Only save to database if the API search was fully successful and it wasn't an empty query
            localStorage.setItem("lastSearchedCity", cityName);

        } catch (error) {
            // Error Handling implementation catches failed conditions or network blockers
            errorMessage.textContent = error.message || "An unexpected asynchronous exception occurred.";
            errorMessage.classList.remove("hidden");
        } finally {
            // Always terminate loading animation state
            loadingMessage.classList.add("hidden");
        }
    }

    // --- DATABASE RETRIEVAL ON PAGE LOAD ---
    // Check the browser database immediately when the application launches
    const savedCity = localStorage.getItem("lastSearchedCity");
    if (savedCity) {
        cityInput.value = savedCity; // Visually place the city name back into the text input
        fetchWeatherMetrics(savedCity); // Automatically pull the live metrics for it
    }

    // Trigger listeners binding processing flow
    searchBtn.addEventListener("click", fetchWeatherMetrics);
    cityInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") fetchWeatherMetrics();
    });
});