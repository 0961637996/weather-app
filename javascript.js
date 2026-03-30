function renderUI(data){
    
    document.body.classList.add("searched");
    document.querySelector(".error").textContent = "";
    document.querySelector(".name").textContent = data.name + "," + data.sys.country;
    document.querySelector(".temp").textContent = data.main.temp + "°C" ;
    document.querySelector(".now").textContent = "Now"
    document.querySelector(".desc").textContent = data.weather[0].description;
    let main = data.weather[0].main;
    let iconlink = geticon(main);
    document.querySelector(".icon").src = iconlink;

    ////////// Bên dưới (Các card phụ)      //////////////
    document.querySelector(".feelslike").textContent = Math.round(data.main.feels_like) + "°C";
    document.querySelector(".humidity").textContent = Math.round(data.main.humidity) + "%";
    document.querySelector(".wind").textContent = Math.round(data.wind.speed) + " m/s";
    document.querySelector(".prec").textContent = Math.round(data.rain?.["1h"] || 0);
}
function geticon(main){
    switch(main){
        case "Clear":
            return "https://img.icons8.com/pulsar-gradient/96/sun.png";
        case "Clouds":
            return "https://img.icons8.com/pulsar-gradient/96/cloud.png";
        case "Rain":
            return "https://img.icons8.com/pulsar-gradient/96/rain.png";
        case "Drizzle":
            return "https://img.icons8.com/pulsar-gradient/96/light-rain.png";
        case "Thunderstorm":
            return "https://img.icons8.com/pulsar-gradient/96/storm.png";
        case "Snow":
            return "https://img.icons8.com/pulsar-gradient/96/snow.png";
        case "Mist":
        case "Fog":
        case "Haze":
            return "https://img.icons8.com/pulsar-gradient/96/fog.png";
        default:
            return "https://img.icons8.com/pulsar-gradient/96/cloud.png";
    }
}

async function getweather(city){
    let text = document.querySelector(".error");
    text.textContent = "Loading...";
    try{
        let res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        if(res.status === 404){
            text.textContent = "Không tìm thấy thành phố.";
            return;
        }
        if(res.status >= 500){
            text.textContent = "Lỗi sever. Vui lòng thử lại sau";
            return;
        }
        if(!res.ok){
            throw new Error("HTTP Error: " + res.status);
        }

        let data = await res.json();
        renderUI(data);
        getforecast(city);
    } catch (error){
        console.error("Lỗi :",error);
        text.textContent = "Không có kết nối internet. Vui lòng kiểm tra kết nối Wifi/4G rồi thử lại."
    }
    
}


let history = JSON.parse(localStorage.getItem("history")) || [];
let hist = document.querySelector(".hist")
let search = document.querySelector(".button");
let input = document.querySelector(".input");
let timeout;
input.addEventListener("input",function(){
    timeout = setTimeout(() => {
        if(input.value.trim()===""){
            hist.style.display = "block";
            input.classList.add("hover");
            renderhistory(history);
        }else{
            hist.style.display = "block";
            input.classList.add("hover");
            getsuggest(input.value.trim());
        }
    },300);
})
input.addEventListener("focus",function(){
    if(input.value.trim()===""){
        hist.style.display = "block";
        input.classList.add("hover");
        renderhistory(history);
    }else{
        hist.style.display = "block";
        input.classList.add("hover");
        getsuggest(input.value.trim());
    }
});
input.addEventListener("blur",function(){
    setTimeout(() => {
        hist.style.display = "none";
    }, 200);
    input.classList.remove("hover");
});


search.addEventListener("click",function(){
    if(input.value.trim()===""){return;}
    else{
        savehistory(input.value.trim());
        getweather(input.value.trim());
        input.blur();
    }
});
input.addEventListener("keydown",function(e){
    if(e.key === "Enter"){
        if(input.value.trim()===""){return;}
        else{
            savehistory(input.value.trim());
            getweather(input.value.trim());
            input.blur();
        }
    }    
});
///////////// LẤY VỊ TRÍ CỦA NGƯỜI DÙNG    ///////////////////////////

navigator.geolocation.getCurrentPosition(
    function(position){
        document.querySelector(".error").textContent = "Loading...";
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        getweatherbyposition(lat,lon);
    }
);

async function getweatherbyposition(lat,lon){
    let text = document.querySelector(".error");
    try{
        let res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        let ress = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if(res.status >= 500){
            text.textContent = "Lỗi sever. Vui lòng thử lại sau";
            return;
        }
        if(!res.ok){
            throw new Error("HTTP Error: " + res.status);
        }
        let data = await res.json();
        let dataa = await ress.json();
        renderUI(data);
        renderForecast(dataa);
    } catch(error){
        console.error("Lỗi: ",error);
        text.textContent = "Không có kết nối internet. Vui lòng kiểm tra kết nối Wifi/4G rồi thử lại."
    }
}

////////////// LẤY FORECAST VÀ RENDER FORECAST ////////////
async function getforecast(city){
    let text = document.querySelector(".error");
    try{
        let res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
        if(res.status >=500){
            text.textContent = "Không thể lấy forecast do lỗi sever.";
            return;
        }
        if(!res.ok){
            throw new Error("Không thể lấy forecast. HTTP Error: " + res.status );
        }
        let data = await res.json();
        renderForecast(data);
    }catch(error){
        console.error("Lỗi: ",error);
        text.textContent = "Không thể lấy forecast. Vui lòng kiểm tra kết nối Wifi/4G và thử lại.";
    }
}

function renderForecast(data){
    let forecast = document.querySelector(".forecastweather");
    forecast.innerHTML="";
    let list = data.list.slice(0,6);
    list.forEach(item => {
        let time = item.dt_txt.split(" ")[1].slice(0,5);
        let temp = Math.round(item.main.temp);
        let div = document.createElement("div");
        div.classList.add("forecast");
        let iconlink = geticon(item.weather[0].main);
        div.innerHTML=`
            <p>${time}</p>
            <img src="${iconlink}">
            <p>${temp}°C</p>
        `;
        forecast.appendChild(div);
    });
}

////////// HÀM LƯU LỊCH SỬ TÌM KIẾM ///////////
function savehistory(city){
    history = history.filter(item => item !== city);
    history.unshift(city);
    if(history.length > 7) history.pop()
    localStorage.setItem("history",JSON.stringify(history));
}

function renderhistory(history){
    hist.innerHTML="";
    history.forEach(function(e){
        let a = document.createElement("p");
        a.classList.add("history-item");
        a.textContent = "🕘 " +e;
        a.addEventListener("click",function(){
            savehistory(e);
            input.value = e;
            getweather(e);
        })
        hist.appendChild(a);
    });
}

function rendersuggest(data){
    let all =[];
    hist.innerHTML="";
    let keyword = input.value.trim().toLowerCase();
    history.forEach(item =>{
        if(item.toLowerCase().includes(keyword)){
            all.push({name:item,country:""});
        }
    })
    data.forEach(item => {
        all.push({name:item.name,country:item.country,lat:item.lat,lon:item.lon})
    })
    all = all.slice(0,7);
    all.forEach(city =>{
        let a = document.createElement("p");
        a.classList.add("history-item");
        if(city.country === ""){
            a.textContent = "🕘 " + city.name;
        }else{
            a.textContent = "🔍 " + city.name + ", " + city.country;
        }
        a.addEventListener("click",function(){
            savehistory(city.name);
            input.value = city.name;
            getweatherbyposition(city.lat,city.lon);
        })
        hist.appendChild(a);
    });
}
/////////// LẤY GỢI Ý TÌM KIẾM ////////////
let currentKeyword = "";
async function getsuggest(keyword){
    currentKeyword = keyword;
    try{
        let res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${keyword}&limit=5&appid=${API_KEY}`)
        if(!res.ok){
            throw new Error("Lỗi: " + res.status);
        }
        let data = await res.json();
        if(input.value.trim() !== keyword){
            return;
        }
        rendersuggest(data);
    } catch(error){
        console.error("Lỗi: ",error);
        hist.innerHTML = `<p class="history-item" style="color: #ef4444; pointer-events: none;">⚠ Không thể tải gợi ý</p>`;
    }
}
////////// DARK MODE /////////////////////////////////
let tog = document.querySelector(".tog");
currentmode = localStorage.getItem("mode");
tog.classList.add("no-transition");
document.body.classList.add("no-transition");
if(currentmode === "light"){
    tog.classList.add("active");
    document.body.classList.add("darkmode");
}else{
    tog.classList.remove("active");
    document.body.classList.remove("darkmode");
}
setTimeout(()=>{
    tog.classList.remove("no-transition");
    document.body.classList.remove("no-transition");
},500)
tog.addEventListener("click",()=>{
    tog.classList.toggle("active");
    document.body.classList.toggle("darkmode");
    if(tog.classList.contains("active")){
        localStorage.setItem("mode","light")
    }else{
        localStorage.setItem("mode","dark")
    }
})

