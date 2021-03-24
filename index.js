const { stringify, decode } = require("querystring");
const { default: axios } = require("axios");
const { config } = require("dotenv");
const express = require("express");

config();

const app = express();
const hrs12 = 1000 * 60 * 60 * 12;
setInterval(updateProfile, hrs12);

app.get("/", (_, res) => {
    res.sendStatus(200);
});

app.get("/login", (_, res) => {
    const params = {
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: "http://localhost:3000/callback",
        scope: "user"
    };
    const query = stringify(params);
    res.redirect(`https://github.com/login/oauth/authorize?${query}`);
});

app.get("/callback", async (req, res) => {
    const { code } = req.query;
    const params = {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
    };
    const query = stringify(params);
    const response = await axios.post(`https://github.com/login/oauth/access_token?${query}`);
    const data = decode(response.data);
    res.send(data.access_token);
});

app.get("/update_profile", async (_, res) => {
    const data = await updateProfile();
    res.send(data);
});

const listener = app.listen(process.env.PORT || 3000, "0.0.0.0", () => console.log(`Express server started on port ${listener.address().port}`));

async function updateProfile() {
    const weatherString = await fetchWeatherInKayseri();
    const { data } = await axios.patch(`https://api.github.com/user`, {
        bio: `${weatherString} Back-end developer with over 10 years experience. - he/him`
    }, 
    {
        headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
        }
    });
    return data;
}

async function fetchWeatherInKayseri() {
    const params = {
        q: "Kayseri, Turkey",
        appid: process.env.WEATHER_API_KEY,
        units: "metric",
    }
    const query = stringify(params);
    const apiUrl = `http://api.openweathermap.org/data/2.5/weather?${query}`;
    const { data } = await axios.get(apiUrl);
    const now = new Date();
    const timeString = now.toLocaleString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        weekday: "short",
		hour12: true,
	});
    return `Current temperature in ${data.name}: ${data.main.temp}°C / ${data.main.feels_like}°C. Last edit: ${timeString}.`;
}
